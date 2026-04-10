import { randomUUID } from 'node:crypto';
import type { ISolarSystemSetupConfig } from '@seti/common/constant/sectorSetup';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import type { EAlienType } from '@seti/common/types/protocol/enums';
import {
  EMainAction,
  EPhase,
  EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { AnalyzeDataAction } from './actions/AnalyzeData.js';
import { LaunchProbeAction } from './actions/LaunchProbe.js';
import { OrbitAction } from './actions/Orbit.js';
import { PassAction } from './actions/Pass.js';
import { PlayCardAction } from './actions/PlayCard.js';
import { ResearchTechAction } from './actions/ResearchTech.js';
import { ScanAction } from './actions/Scan.js';
import { AlienState } from './alien/AlienState.js';
import type { PlanetaryBoard } from './board/PlanetaryBoard.js';
import type { Sector } from './board/Sector.js';
import type { SolarSystem } from './board/SolarSystem.js';
import { type EMarkSource, Mark } from './cards/utils/Mark.js';
import { Deck } from './deck/Deck.js';
import { DeferredActionsQueue } from './deferred/DeferredActionsQueue.js';
import { EPriority } from './deferred/Priority.js';
import { ResolveDiscovery } from './deferred/ResolveDiscovery.js';
import { ResolveMilestone } from './deferred/ResolveMilestone.js';
import { ResolveSectorCompletion } from './deferred/ResolveSectorCompletion.js';
import { SimpleDeferredAction } from './deferred/SimpleDeferredAction.js';
import { EventLog } from './event/EventLog.js';
import {
  createActionEvent,
  createGameEndEvent,
  createRoundEndEvent,
} from './event/GameEvent.js';
import { processFreeAction } from './freeActions/processFreeAction.js';
import { createGameOptions, type IGameOptions } from './GameOptions.js';
import { GameSetup } from './GameSetup.js';
import type { IGame, IGamePlayerIdentity } from './IGame.js';
import type { PlayerInput } from './input/PlayerInput.js';
import { EMissionEventType } from './missions/IMission.js';
import { MissionTracker } from './missions/MissionTracker.js';
import { assertValidPhaseTransition } from './Phase.js';
import type { IPlayer, TCardItem } from './player/IPlayer.js';
import { Player } from './player/Player.js';
import {
  FinalScoring,
  type IFinalScoringResult,
} from './scoring/FinalScoring.js';
import type { GoldScoringTile } from './scoring/GoldScoringTile.js';
import { MilestoneState } from './scoring/Milestone.js';
import type { TechBoard } from './tech/TechBoard.js';

const MAX_ROUNDS = 5;

export class Game implements IGame {
  public readonly id: string;

  public readonly seed: string;

  public readonly options: Readonly<IGameOptions>;

  public readonly players: ReadonlyArray<IPlayer>;

  public phase: EPhase;

  public round: number;

  public activePlayer: IPlayer;

  public startPlayer: IPlayer;

  public solarSystem: SolarSystem | null;

  public solarSystemSetup: ISolarSystemSetupConfig | null;

  public planetaryBoard: PlanetaryBoard | null;

  public techBoard: TechBoard | null;

  public sectors: Sector[];

  public alienState: AlienState;

  public milestoneState: MilestoneState;

  public goldScoringTiles: GoldScoringTile[];

  public finalScoringResult?: IFinalScoringResult;

  public mainDeck: Deck<string>;

  public cardRow: TCardItem[];

  public endOfRoundStacks: TCardItem[][];

  public hiddenAliens: EAlienType[];

  public neutralMilestones: number[];

  public roundRotationReminderIndex: number;

  public deferredActions: DeferredActionsQueue;

  public missionTracker: MissionTracker;

  public eventLog: EventLog;

  public random: SeededRandom;

  private rotationCounterValue: number;

  public hasRoundFirstPassOccurred: boolean;

  private constructor(
    id: string,
    playerIdentities: ReadonlyArray<IGamePlayerIdentity>,
    options: Readonly<IGameOptions>,
    seed: string,
  ) {
    this.id = id;
    this.seed = seed;
    this.players = playerIdentities.map(
      (playerIdentity) => new Player(playerIdentity),
    );
    this.options = options;

    this.phase = EPhase.SETUP;
    this.round = 1;
    this.startPlayer = this.players[0];
    this.activePlayer = this.startPlayer;

    this.solarSystem = null;
    this.solarSystemSetup = null;
    this.planetaryBoard = null;
    this.techBoard = null;
    this.sectors = [];
    this.alienState = AlienState.createFromHiddenAliens([]);
    this.milestoneState = new MilestoneState([]);
    this.goldScoringTiles = [];
    this.mainDeck = new Deck<string>();
    this.cardRow = [];
    this.endOfRoundStacks = [];
    this.hiddenAliens = [];
    this.neutralMilestones = [];
    this.roundRotationReminderIndex = 0;
    this.deferredActions = new DeferredActionsQueue();
    this.missionTracker = new MissionTracker();
    this.eventLog = new EventLog();

    this.random = new SeededRandom(seed);
    this.rotationCounterValue = 0;
    this.hasRoundFirstPassOccurred = false;
    this.finalScoringResult = undefined;

    this.players.forEach((player) => player.bindGame(this));
  }

  public static create(
    players: ReadonlyArray<IGamePlayerIdentity>,
    options: Partial<IGameOptions>,
    seed: string,
    id: string = randomUUID(),
  ): Game {
    if (players.length === 0) {
      throw new Error('players must not be empty');
    }

    const resolvedOptions = createGameOptions(options);
    if (players.length !== resolvedOptions.playerCount) {
      throw new Error('players length must match options.playerCount');
    }

    const game = new Game(id, players, resolvedOptions, seed);
    GameSetup.initialize(game);
    return game;
  }

  public transitionTo(nextPhase: EPhase): void {
    assertValidPhaseTransition(this.phase, nextPhase);
    this.phase = nextPhase;
  }

  public getActivePlayer(): IPlayer {
    return this.activePlayer;
  }

  public get rotationCounter(): number {
    return this.solarSystem?.rotationCounter ?? this.rotationCounterValue;
  }

  public set rotationCounter(value: number) {
    this.rotationCounterValue = value;
    if (this.solarSystem !== null) {
      this.solarSystem.rotationCounter = value;
    }
  }

  public getNextPlayer(fromPlayerId: string = this.activePlayer.id): IPlayer {
    const currentPlayerIndex = this.players.findIndex(
      (player) => player.id === fromPlayerId,
    );
    if (currentPlayerIndex < 0) {
      throw new Error(`Unknown player id: ${fromPlayerId}`);
    }

    const nextPlayerIndex = (currentPlayerIndex + 1) % this.players.length;
    return this.players[nextPlayerIndex];
  }

  public setActivePlayer(playerId: string): void {
    const selectedPlayer = this.players.find(
      (player) => player.id === playerId,
    );
    if (!selectedPlayer) {
      throw new Error(`Unknown player id: ${playerId}`);
    }

    this.activePlayer = selectedPlayer;
  }

  public processMainAction(playerId: string, action: IMainActionRequest): void {
    this.assertCanTakeTurnAction(playerId, [EPhase.AWAIT_MAIN_ACTION]);

    const player = this.getPlayer(playerId);
    this.assertMainActionIsLegal(player, action);
    this.transitionTo(EPhase.IN_RESOLUTION);
    this.enqueueMainActionPipeline(player, action);
    this.runResolutionPipeline();
  }

  public processFreeAction(playerId: string, action: IFreeActionRequest): void {
    this.assertCanTakeTurnAction(playerId, [
      EPhase.AWAIT_MAIN_ACTION,
      EPhase.IN_RESOLUTION,
    ]);

    const player = this.getPlayer(playerId);
    const pendingInput = processFreeAction(player, this, action);

    if (pendingInput) {
      player.waitingFor = pendingInput;
    }

    if (!player.waitingFor) {
      const missionInput = this.missionTracker.checkAndPromptTriggers(
        player,
        this,
      );
      if (missionInput) {
        player.waitingFor = missionInput;
      }
    }

    this.eventLog.append(
      createActionEvent(playerId, `FREE_ACTION:${action.type}`, {
        type: action.type,
      }),
    );
  }

  public processInput(playerId: string, response: IInputResponse): void {
    const player = this.getPlayer(playerId);
    if (!player.waitingFor) {
      throw new GameError(
        EErrorCode.INVALID_INPUT_RESPONSE,
        `Player ${playerId} is not waiting for input`,
      );
    }

    const nextInput = player.waitingFor.process(response);
    if (nextInput !== undefined) {
      player.waitingFor = nextInput;
      return;
    }

    player.waitingFor = undefined;
    this.runResolutionPipeline();
  }

  public mark(
    source: EMarkSource,
    count: number,
    playerId: string = this.activePlayer.id,
  ): PlayerInput | undefined {
    const player = this.getPlayer(playerId);
    return Mark.execute(player, this, source, count);
  }

  public markTrace(
    traceColor: ETrace,
    playerId: string = this.activePlayer.id,
    onComplete?: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const player = this.getPlayer(playerId);
    return this.alienState.createTraceInput(
      player,
      this,
      traceColor,
      onComplete,
    );
  }

  private runResolutionPipeline(): void {
    const pendingInput = this.drainDeferredQueue();
    if (pendingInput !== undefined) {
      return;
    }

    if (this.phase === EPhase.IN_RESOLUTION) {
      this.transitionTo(EPhase.BETWEEN_TURNS);
      this.enqueueBetweenTurnPipeline(this.activePlayer);

      const betweenTurnInput = this.drainDeferredQueue();
      if (betweenTurnInput !== undefined) {
        return;
      }
    }
  }

  private drainDeferredQueue(): PlayerInput | undefined {
    const pendingInput = this.deferredActions.drain(this);
    if (pendingInput !== undefined) {
      pendingInput.player.waitingFor = pendingInput;
      return pendingInput;
    }

    return undefined;
  }

  private enqueueMainActionPipeline(
    player: IPlayer,
    action: IMainActionRequest,
  ): void {
    this.deferredActions.pushMultiple([
      new SimpleDeferredAction(
        player,
        (game) => {
          game.eventLog.append(
            createActionEvent(player.id, `${action.type}:COST`, {
              action: action.type,
            }),
          );
          return undefined;
        },
        EPriority.COST,
      ),
      new SimpleDeferredAction(
        player,
        (game) => {
          let pendingInput: PlayerInput | undefined;

          switch (action.type) {
            case EMainAction.LAUNCH_PROBE: {
              LaunchProbeAction.execute(player, game);
              game.missionTracker.recordEvent({
                type: EMissionEventType.PROBE_LAUNCHED,
              });
              break;
            }
            case EMainAction.ORBIT: {
              const planet = this.getPlanetPayload(action);
              OrbitAction.execute(player, game, planet);
              game.missionTracker.recordEvent({
                type: EMissionEventType.PROBE_ORBITED,
                planet,
              });
              break;
            }
            case EMainAction.LAND: {
              const planet = this.getPlanetPayload(action);
              const isMoon = this.getMoonPayload(action);
              player.land(planet, { isMoon });
              game.missionTracker.recordEvent({
                type: EMissionEventType.PROBE_LANDED,
                planet,
                isMoon,
              });
              break;
            }
            case EMainAction.SCAN: {
              pendingInput = ScanAction.execute(player, game);
              game.missionTracker.recordEvent({
                type: EMissionEventType.SCAN_PERFORMED,
              });
              break;
            }
            case EMainAction.ANALYZE_DATA: {
              AnalyzeDataAction.execute(player, game);
              break;
            }
            case EMainAction.PLAY_CARD: {
              const result = PlayCardAction.execute(
                player,
                game,
                this.getCardIndexPayload(action),
              );
              if (result.destination === 'mission') {
                const missionDef = result.card?.getMissionDef?.();
                if (missionDef) {
                  game.missionTracker.registerMission(missionDef, player.id);
                } else {
                  game.missionTracker.registerMissionFromCard(
                    result.cardId,
                    player.id,
                  );
                }
              }
              game.missionTracker.recordEvent({
                type: EMissionEventType.CARD_PLAYED,
                cost: result.price,
                costType: result.priceType,
              });
              break;
            }
            case EMainAction.RESEARCH_TECH: {
              pendingInput = ResearchTechAction.execute(player, game);
              break;
            }
            case EMainAction.PASS: {
              pendingInput = PassAction.execute(player, game);
              break;
            }
          }

          game.eventLog.append(createActionEvent(player.id, action.type));
          return pendingInput;
        },
        EPriority.CORE_EFFECT,
      ),
      new SimpleDeferredAction(
        player,
        (game) => {
          game.eventLog.append(
            createActionEvent(player.id, `${action.type}:REWARD`, {
              action: action.type,
            }),
          );
          return undefined;
        },
        EPriority.IMMEDIATE_REWARD,
      ),
      new SimpleDeferredAction(
        player,
        (game) => game.missionTracker.checkAndPromptTriggers(player, game),
        EPriority.CARD_TRIGGER,
      ),
      new ResolveSectorCompletion(player),
    ]);
  }

  private enqueueBetweenTurnPipeline(player: IPlayer): void {
    this.deferredActions.pushMultiple([
      new SimpleDeferredAction(
        player,
        (game) => {
          game.eventLog.append(createActionEvent(player.id, 'MILESTONE_CHECK'));
          return undefined;
        },
        EPriority.MILESTONE,
      ),
      new ResolveMilestone(player),
      new ResolveDiscovery(player),
      new SimpleDeferredAction(
        player,
        () => {
          this.handoffTurnFrom(player.id);
          return undefined;
        },
        EPriority.TURN_HANDOFF,
      ),
    ]);
  }

  private handoffTurnFrom(playerId: string): void {
    if (this.players.every((player) => player.passed)) {
      this.transitionTo(EPhase.END_OF_ROUND);
      this.resolveEndOfRound();
      return;
    }

    const nextPlayer = this.findNextActivePlayer(playerId);
    if (!nextPlayer) {
      this.transitionTo(EPhase.END_OF_ROUND);
      this.resolveEndOfRound();
      return;
    }

    this.activePlayer = nextPlayer;
    this.transitionTo(EPhase.AWAIT_MAIN_ACTION);
  }

  private resolveEndOfRound(): void {
    this.eventLog.append(createRoundEndEvent(this.round));

    for (const player of this.players) {
      const payout = player.income.computeRoundPayout();
      player.resources.gain(payout);
      player.passed = false;
    }

    this.startPlayer = this.getNextPlayer(this.startPlayer.id);
    this.activePlayer = this.startPlayer;
    this.roundRotationReminderIndex = Math.min(
      this.roundRotationReminderIndex + 1,
      4,
    );
    this.hasRoundFirstPassOccurred = false;

    if (this.round >= MAX_ROUNDS) {
      this.transitionTo(EPhase.FINAL_SCORING);
      this.finalScoringResult = FinalScoring.score(this);
      for (const player of this.players) {
        player.score =
          this.finalScoringResult.scores[player.id] ?? player.score;
      }
      this.eventLog.append(createGameEndEvent(this.finalScoringResult.scores));
      this.transitionTo(EPhase.GAME_OVER);
      return;
    }

    this.round += 1;
    this.transitionTo(EPhase.AWAIT_MAIN_ACTION);
  }

  private findNextActivePlayer(fromPlayerId: string): IPlayer | undefined {
    const fromIndex = this.players.findIndex(
      (player) => player.id === fromPlayerId,
    );
    if (fromIndex < 0) {
      return undefined;
    }

    for (let offset = 1; offset <= this.players.length; offset += 1) {
      const nextIndex = (fromIndex + offset) % this.players.length;
      const candidate = this.players[nextIndex];
      if (!candidate.passed) {
        return candidate;
      }
    }

    return undefined;
  }

  private assertCanTakeTurnAction(
    playerId: string,
    allowedPhases: readonly EPhase[],
  ): void {
    if (!allowedPhases.includes(this.phase)) {
      throw new GameError(
        EErrorCode.INVALID_PHASE,
        `Action not allowed during phase ${this.phase}`,
        {
          phase: this.phase,
          allowedPhases,
        },
      );
    }

    if (this.activePlayer.id !== playerId) {
      throw new GameError(
        EErrorCode.NOT_YOUR_TURN,
        `Player ${playerId} is not the active player`,
        {
          playerId,
          activePlayerId: this.activePlayer.id,
        },
      );
    }
  }

  private getPlayer(playerId: string): IPlayer {
    const player = this.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      throw new GameError(
        EErrorCode.PLAYER_NOT_FOUND,
        `Unknown player id: ${playerId}`,
        { playerId },
      );
    }

    return player;
  }

  private assertMainActionIsLegal(
    player: IPlayer,
    action: IMainActionRequest,
  ): void {
    switch (action.type) {
      case EMainAction.LAUNCH_PROBE: {
        if (!LaunchProbeAction.canExecute(player, this)) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'LaunchProbe requirements are not met',
            { playerId: player.id },
          );
        }
        return;
      }
      case EMainAction.ORBIT: {
        const planet = this.getPlanetPayload(action);
        if (!OrbitAction.canExecute(player, this, planet)) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'Orbit requirements are not met',
            {
              playerId: player.id,
              planet,
            },
          );
        }
        return;
      }
      case EMainAction.LAND: {
        const planet = this.getPlanetPayload(action);
        const isMoon = this.getMoonPayload(action);
        if (!player.canLand(planet, { isMoon })) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'Land requirements are not met',
            {
              playerId: player.id,
              planet,
              isMoon,
            },
          );
        }
        return;
      }
      case EMainAction.SCAN: {
        if (!ScanAction.canExecute(player, this)) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'Scan requirements are not met',
            { playerId: player.id },
          );
        }
        return;
      }
      case EMainAction.ANALYZE_DATA: {
        if (!AnalyzeDataAction.canExecute(player, this)) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'AnalyzeData requirements are not met',
            { playerId: player.id },
          );
        }
        return;
      }
      case EMainAction.PLAY_CARD: {
        const cardIndex = this.getCardIndexPayload(action);
        if (cardIndex < 0 || cardIndex >= player.hand.length) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'Play card payload.cardIndex is out of range',
            {
              playerId: player.id,
              cardIndex,
              handSize: player.hand.length,
            },
          );
        }
        if (!PlayCardAction.canExecute(player, this)) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'Play card requirements are not met',
            {
              playerId: player.id,
            },
          );
        }
        return;
      }
      case EMainAction.RESEARCH_TECH: {
        if (!ResearchTechAction.canExecute(player, this)) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'ResearchTech requirements are not met',
            { playerId: player.id },
          );
        }
        return;
      }
      case EMainAction.PASS: {
        if (!PassAction.canExecute(player, this)) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'Pass is not currently allowed',
            { playerId: player.id },
          );
        }
        return;
      }
    }
  }

  private getPlanetPayload(action: IMainActionRequest): EPlanet {
    const candidate = action.payload?.planet;
    if (!Object.values(EPlanet).includes(candidate as EPlanet)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Action payload.planet must be a valid EPlanet',
        {
          actionType: action.type,
          payload: action.payload,
        },
      );
    }
    if (candidate === EPlanet.EARTH) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Earth cannot be selected for orbit/land',
        {
          actionType: action.type,
        },
      );
    }
    return candidate as EPlanet;
  }

  private getMoonPayload(action: IMainActionRequest): boolean {
    return action.payload?.isMoon === true;
  }

  private getCardIndexPayload(action: IMainActionRequest): number {
    const cardIndex = action.payload?.cardIndex;
    if (!Number.isInteger(cardIndex)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Action payload.cardIndex must be an integer',
        {
          actionType: action.type,
          payload: action.payload,
        },
      );
    }
    return cardIndex as number;
  }
}
