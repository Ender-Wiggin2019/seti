import { randomUUID } from 'node:crypto';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import { EMainAction, EPhase } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import type { SolarSystem } from './board/SolarSystem.js';
import { DeferredActionsQueue } from './deferred/DeferredActionsQueue.js';
import { EPriority } from './deferred/Priority.js';
import { SimpleDeferredAction } from './deferred/SimpleDeferredAction.js';
import { EventLog } from './event/EventLog.js';
import {
  createActionEvent,
  createGameEndEvent,
  createRoundEndEvent,
} from './event/GameEvent.js';
import { createGameOptions, type IGameOptions } from './GameOptions.js';
import { GameSetup } from './GameSetup.js';
import type { IGame, IGamePlayerIdentity } from './IGame.js';
import type { PlayerInput } from './input/PlayerInput.js';
import { assertValidPhaseTransition } from './Phase.js';
import type { IPlayer } from './player/IPlayer.js';
import { Player } from './player/Player.js';

const MAX_ROUNDS = 5;

export class Game implements IGame {
  public readonly id: string;

  public readonly options: Readonly<IGameOptions>;

  public readonly players: ReadonlyArray<IPlayer>;

  public phase: EPhase;

  public round: number;

  public activePlayer: IPlayer;

  public startPlayer: IPlayer;

  public solarSystem: SolarSystem | null;

  public planetaryBoard: unknown;

  public techBoard: unknown;

  public sectors: unknown[];

  public mainDeck: unknown;

  public cardRow: unknown[];

  public endOfRoundStacks: unknown[][];

  public hiddenAliens: string[];

  public neutralMilestones: number[];

  public roundRotationReminderIndex: number;

  public deferredActions: DeferredActionsQueue;

  public eventLog: EventLog;

  public random: SeededRandom;

  public rotationCounter: number;

  public hasRoundFirstPassOccurred: boolean;

  private constructor(
    id: string,
    playerIdentities: ReadonlyArray<IGamePlayerIdentity>,
    options: Readonly<IGameOptions>,
    seed: string,
  ) {
    this.id = id;
    this.players = playerIdentities.map(
      (playerIdentity) => new Player(playerIdentity),
    );
    this.options = options;

    this.phase = EPhase.SETUP;
    this.round = 1;
    this.startPlayer = this.players[0];
    this.activePlayer = this.startPlayer;

    this.solarSystem = null;
    this.planetaryBoard = null;
    this.techBoard = null;
    this.sectors = [];
    this.mainDeck = null;
    this.cardRow = [];
    this.endOfRoundStacks = [];
    this.hiddenAliens = [];
    this.neutralMilestones = [];
    this.roundRotationReminderIndex = 0;
    this.deferredActions = new DeferredActionsQueue();
    this.eventLog = new EventLog();

    this.random = new SeededRandom(seed);
    this.rotationCounter = 0;
    this.hasRoundFirstPassOccurred = false;

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
    this.transitionTo(EPhase.IN_RESOLUTION);
    this.enqueueMainActionPipeline(player, action);
    this.runResolutionPipeline();
  }

  public processFreeAction(playerId: string, action: IFreeActionRequest): void {
    this.assertCanTakeTurnAction(playerId, [
      EPhase.AWAIT_MAIN_ACTION,
      EPhase.IN_RESOLUTION,
    ]);

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
          if (action.type === EMainAction.PASS) {
            const actor = game.players.find(
              (candidate) => candidate.id === player.id,
            );
            if (actor) {
              actor.passed = true;
              if (!game.hasRoundFirstPassOccurred) {
                game.hasRoundFirstPassOccurred = true;
                game.rotationCounter += 1;
              }
            }
          }

          game.eventLog.append(createActionEvent(player.id, action.type));
          return undefined;
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
      new SimpleDeferredAction(
        player,
        (game) => {
          game.eventLog.append(createActionEvent(player.id, 'DISCOVERY_CHECK'));
          return undefined;
        },
        EPriority.DISCOVERY,
      ),
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
      const finalScores = Object.fromEntries(
        this.players.map((player) => [player.id, player.score]),
      );
      this.eventLog.append(createGameEndEvent(finalScores));
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
}
