import { baseCards } from '@seti/common/data/baseCards';
import { createOrganizationSetupCandidates } from '@seti/common/data/organizations';
import { createPreludeSetupCandidates } from '@seti/common/data/preludeCards';
import { spaceAgencyCards } from '@seti/common/data/spaceAgencyCards';
import {
  DEFAULT_PLAYER_ACTION_COSTS,
  type EOrganizationId,
} from '@seti/common/types/organization';
import { EAlienType, EPhase } from '@seti/common/types/protocol/enums';
import { ESetupChoiceStepKind } from '@seti/common/types/protocol/playerInput';
import { AlienState } from './alien/AlienState.js';
import { PlanetaryBoard } from './board/PlanetaryBoard.js';
import { SolarSystem } from './board/SolarSystem.js';
import { BaseCorporation } from './corporation/BaseCorporation.js';
import { Deck } from './deck/Deck.js';
import { DeferredActionsQueue } from './deferred/DeferredActionsQueue.js';
import { TuckCardForIncomeEffect } from './effects/income/TuckCardForIncomeEffect.js';
import { EventLog } from './event/EventLog.js';
import type { Game } from './Game.js';
import { isAlienEnabled, isSoloMode } from './GameOptions.js';
import { OrganizationRegistry } from './organization/OrganizationRegistry.js';
import { Income } from './player/Income.js';
import type { IPlayer } from './player/IPlayer.js';
import { Resources } from './player/Resources.js';
import { PreludeCardRuntime } from './prelude/PreludeCardRuntime.js';
import {
  GoldScoringTile,
  type TGoldScoringTileId,
} from './scoring/GoldScoringTile.js';
import { MilestoneState } from './scoring/Milestone.js';
import type { ISetupChoiceConfig } from './setup/SetupChoiceConfig.js';
import { SetupChoiceCoordinator } from './setup/SetupChoiceCoordinator.js';
import { RivalSetup } from './solo/RivalSetup.js';
import { TechBoard } from './tech/TechBoard.js';

const GOLD_TILE_IDS: readonly TGoldScoringTileId[] = [
  'tech',
  'mission',
  'income',
  'other',
];

const CORE_RANDOM_ALIENS: readonly EAlienType[] = [
  EAlienType.ANOMALIES,
  EAlienType.CENTAURIANS,
  EAlienType.EXERTIANS,
  EAlienType.MASCAMITES,
  EAlienType.OUMUAMUA,
];

const SPACE_AGENCY_RANDOM_ALIENS: readonly EAlienType[] = [
  EAlienType.GLYPHIDS,
  EAlienType.AMOEBA,
  EAlienType.ARKHOS,
];

export class GameSetup {
  public static initialize(game: Game): void {
    GameSetup.assertSupportedSpaceAgencyOptions(game);

    const boardResult = SolarSystem.init(game.random);

    game.solarSystem = boardResult.solarSystem;
    game.solarSystemSetup = boardResult.setupConfig;
    game.sectors = boardResult.sectors;
    game.planetaryBoard = new PlanetaryBoard();
    game.techBoard = new TechBoard(game.random);

    game.mainDeck = new Deck(GameSetup.createMainDeckCardIds(game));
    game.mainDeck.shuffle(game.random);
    game.cardRow = game.mainDeck.drawN(3);
    const agenciesEnabled = GameSetup.isAgenciesSetupEnabled(game);
    game.endOfRoundStacks = Array.from(
      { length: agenciesEnabled ? 3 : 4 },
      () => game.mainDeck.drawN(game.options.playerCount + 1),
    );

    if (agenciesEnabled) {
      game.round = 2;
    }

    const selectableAliens = GameSetup.getSelectableAliens(game);
    const alienPool = game.random.shuffle(selectableAliens);
    game.hiddenAliens = alienPool.slice(0, 2);
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    game.neutralMilestones = GameSetup.buildNeutralMilestones(
      game.options.playerCount,
    );
    game.milestoneState = new MilestoneState(game.neutralMilestones);
    game.goldScoringTiles = GOLD_TILE_IDS.map(
      (id) =>
        new GoldScoringTile({
          id,
          side: game.random.next() < 0.5 ? 'A' : 'B',
        }),
    );
    game.roundRotationReminderIndex = 0;

    const soloRivalPlayer = isSoloMode(game.options)
      ? RivalSetup.getRivalPlayer(game)
      : undefined;

    if (soloRivalPlayer) {
      const startIndex = game.random.nextInt(game.players.length);
      game.startPlayer = game.players[startIndex];
      game.activePlayer = game.startPlayer;
    }

    const setupChoicePlayers: IPlayer[] = [];
    game.players.forEach((player) => {
      player.score = soloRivalPlayer
        ? player.id === game.startPlayer.id
          ? 1
          : 2
        : player.seatIndex + 1;
      player.publicity = agenciesEnabled ? 0 : 4;
      player.passed = false;
      player.playedMissions = [];
      player.playedCards = [];
      player.completedMissions = [];
      player.endGameCards = [];
      player.tuckedIncomeCards = [];
      player.hand = [];
      player.organizationIds = [];
      player.organizationState = {};
      player.oncePerRoundUsed = {};
      player.actionCosts = { ...DEFAULT_PLAYER_ACTION_COSTS };
      player.quickStartCardIds = [];
      player.setupChoiceContext = undefined;
      if (player === soloRivalPlayer) {
        RivalSetup.initialize(game);
        return;
      }
      if (agenciesEnabled) {
        GameSetup.initializeAgenciesPlayer(player, game);
        setupChoicePlayers.push(player);
        return;
      }
      BaseCorporation.resolve(player, game);
      player.pendingSetupTucks = BaseCorporation.startActions.tuckIncome;
      player.waitingFor = TuckCardForIncomeEffect.executeSetupChain(
        player,
        game,
      );
    });

    game.deferredActions = new DeferredActionsQueue();
    game.eventLog = new EventLog();

    if (agenciesEnabled) {
      game.transitionTo(EPhase.SETUP_CHOICE);
      const organizationCandidatesByPlayer =
        GameSetup.dealOrganizationCandidates(game, setupChoicePlayers);
      const quickStartCandidatesByPlayer = GameSetup.dealQuickStartCandidates(
        game,
        setupChoicePlayers,
      );
      SetupChoiceCoordinator.beginPerPlayer(
        setupChoicePlayers,
        (player) =>
          GameSetup.createAgenciesSetupChoiceConfig(
            organizationCandidatesByPlayer.get(player.id) ?? [],
            quickStartCandidatesByPlayer.get(player.id) ?? [],
          ),
        () => GameSetup.resolveSetupChoiceSelections(game),
      );
      return;
    }

    game.transitionTo(EPhase.AWAIT_MAIN_ACTION);
  }

  public static resolveSetupChoiceSelections(game: Game): void {
    const organizationPlayers = game.players.filter((player) =>
      player.setupChoiceContext?.steps.some(
        (step) => step.kind === ESetupChoiceStepKind.ORGANIZATION,
      ),
    );
    const quickStartIdsByPlayer = new Map<IPlayer, string[]>();

    for (const player of organizationPlayers) {
      if (player.quickStartCardIds.length === 0) {
        const quickStartCardIds =
          GameSetup.getSelectedQuickStartCardIds(player);
        if (quickStartCardIds.length > 0) {
          player.quickStartCardIds = quickStartCardIds;
          quickStartIdsByPlayer.set(player, quickStartCardIds);
        }
      }
    }

    for (const [player, quickStartCardIds] of quickStartIdsByPlayer) {
      PreludeCardRuntime.resolvePlayerCards(player, game, quickStartCardIds);
    }

    for (const player of organizationPlayers) {
      if (player.organizationIds.length > 0) {
        continue;
      }
      const organizationId = GameSetup.getSelectedOrganizationId(player);
      OrganizationRegistry.create(organizationId).resolve(player, game);
    }

    for (const player of organizationPlayers) {
      player.waitingFor =
        player.pendingSetupTucks > 0
          ? TuckCardForIncomeEffect.executeSetupChain(player, game)
          : undefined;
    }

    if (game.phase === EPhase.SETUP_CHOICE) {
      game.transitionTo(EPhase.AWAIT_MAIN_ACTION);
    }
  }

  private static initializeAgenciesPlayer(player: IPlayer, game: Game): void {
    player.resources = new Resources(
      { credits: 0, energy: 0, publicity: 0, data: 0, signalTokens: 0 },
      { dataController: player.data },
    );
    player.income = new Income();
    player.hand = game.mainDeck.drawN(4);
    player.pendingSetupTucks = 0;
    player.probesInSpace = 0;
    player.waitingFor = undefined;
  }

  private static createAgenciesSetupChoiceConfig(
    organizationCandidates: ReturnType<
      typeof createOrganizationSetupCandidates
    >,
    quickStartCandidates: ReturnType<typeof createPreludeSetupCandidates>,
  ): ISetupChoiceConfig {
    const steps: ISetupChoiceConfig['steps'] = [
      {
        kind: ESetupChoiceStepKind.ORGANIZATION,
        title: 'Choose organization',
        enabled: true,
        minSelections: 1,
        maxSelections: 1,
        candidates: organizationCandidates,
      },
    ];

    if (quickStartCandidates.length > 0) {
      steps.push({
        kind: ESetupChoiceStepKind.QUICK_START_CARDS,
        title: 'Choose Quick Start Cards',
        enabled: true,
        minSelections: 2,
        maxSelections: 2,
        candidates: quickStartCandidates,
      });
    }

    return { steps };
  }

  private static dealOrganizationCandidates(
    game: Game,
    players: readonly IPlayer[],
  ): Map<string, ReturnType<typeof createOrganizationSetupCandidates>> {
    const shuffledOrganizations = game.random.shuffle(
      createOrganizationSetupCandidates(),
    );
    const candidatesByPlayer = new Map<
      string,
      ReturnType<typeof createOrganizationSetupCandidates>
    >();

    for (let index = 0; index < players.length; index += 1) {
      candidatesByPlayer.set(
        players[index].id,
        shuffledOrganizations.slice(index * 2, index * 2 + 2),
      );
    }

    return candidatesByPlayer;
  }

  private static dealQuickStartCandidates(
    game: Game,
    players: readonly IPlayer[],
  ): Map<string, ReturnType<typeof createPreludeSetupCandidates>> {
    if (game.options.spaceAgencyOptions?.startResourceCards !== true) {
      return new Map();
    }

    const shuffledQuickStartCards = game.random.shuffle(
      createPreludeSetupCandidates(),
    );
    let nextIndex = 0;

    if (game.options.playerCount <= 2) {
      const neutralCards = shuffledQuickStartCards.slice(
        nextIndex,
        nextIndex + 4,
      );
      nextIndex += neutralCards.length;
      for (const card of neutralCards) {
        PreludeCardRuntime.resolveNeutralUpper(game, card.id);
      }
    }

    const candidatesByPlayer = new Map<
      string,
      ReturnType<typeof createPreludeSetupCandidates>
    >();

    for (const player of players) {
      candidatesByPlayer.set(
        player.id,
        shuffledQuickStartCards.slice(nextIndex, nextIndex + 3),
      );
      nextIndex += 3;
    }

    return candidatesByPlayer;
  }

  private static getSelectedOrganizationId(player: IPlayer): EOrganizationId {
    const organizationStep = player.setupChoiceContext?.steps.find(
      (step) => step.kind === ESetupChoiceStepKind.ORGANIZATION,
    );
    const organizationId = organizationStep?.selectedIds[0];
    if (!organizationId) {
      throw new Error(`Player ${player.id} did not select an organization`);
    }
    return organizationId as EOrganizationId;
  }

  private static getSelectedQuickStartCardIds(player: IPlayer): string[] {
    const quickStartStep = player.setupChoiceContext?.steps.find(
      (step) => step.kind === ESetupChoiceStepKind.QUICK_START_CARDS,
    );
    return [...(quickStartStep?.selectedIds ?? [])];
  }

  private static isAgenciesSetupEnabled(game: Game): boolean {
    return (
      game.options.spaceAgencyOptions?.enabled === true &&
      game.options.spaceAgencyOptions.agencies === true
    );
  }

  private static assertSupportedSpaceAgencyOptions(game: Game): void {
    const options = game.options.spaceAgencyOptions;
    if (options?.enabled !== true) {
      return;
    }

    return;
  }

  private static createMainDeckCardIds(game: Game): string[] {
    const cardIds = baseCards.map((card) => card.id);
    if (game.options.spaceAgencyOptions?.newDeck === true) {
      cardIds.push(...spaceAgencyCards.map((card) => card.id));
    }
    return cardIds;
  }

  private static buildNeutralMilestones(playerCount: number): number[] {
    if (playerCount === 2) {
      return [20, 20, 30, 30];
    }
    if (playerCount === 3) {
      return [20, 30];
    }
    return [];
  }

  private static getSelectableAliens(game: Game): EAlienType[] {
    const candidates = [...CORE_RANDOM_ALIENS];
    if (
      game.options.spaceAgencyOptions?.enabled === true &&
      game.options.spaceAgencyOptions.newAlienSpecies === true
    ) {
      candidates.push(...SPACE_AGENCY_RANDOM_ALIENS);
    }
    return candidates.filter((alienType) =>
      isAlienEnabled(game.options, alienType),
    );
  }
}
