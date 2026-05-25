import { RIVAL_COMPUTER_SLOT_REWARDS } from '@seti/common/constant/solo';
import {
  getAvailableFreeActions,
  getAvailableMainActions,
} from '@seti/common/rules';
import {
  EAlienIcon,
  EResource,
  ESector,
  ETech,
} from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import {
  EAlienType,
  EFreeAction,
  EMainAction,
  EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import {
  createGameOptions,
  EExpansion,
} from '@seti/common/types/protocol/options';
import {
  EPlayerInputType,
  ESetupChoiceStepKind,
  type ISelectEndOfRoundCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import {
  isAmoebaAlienBoard,
  isAnomaliesAlienBoard,
  isArkhosAlienBoard,
  isCentauriansAlienBoard,
  isExertiansAlienBoard,
  isGlyphidsAlienBoard,
  isMascamitesAlienBoard,
  isOumuamuaAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import {
  recordScanSignalTokenSpend,
  ScanActionPool,
} from '@/engine/effects/scan/ScanActionPool.js';
import { Game } from '@/engine/Game.js';
import {
  projectGameState,
  serializeGame,
} from '@/persistence/serializer/GameSerializer.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

function createTestGame(): Game {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'serializer-seed',
    'game-serializer-test',
  );
  resolveSetupTucks(game);
  return game;
}

function createSoloTestGame(): Game {
  return Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      {
        id: 'rival:game-serializer-solo',
        name: 'Rival Institution',
        color: 'blue',
        seatIndex: 1,
      },
    ],
    {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty: 4,
    } as Parameters<typeof Game.create>[1],
    'serializer-solo-seed',
    'game-serializer-solo',
  );
}

describe('GameSerializer', () => {
  it('serializes core state and RNG snapshot', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 7);

    expect(dto.gameId).toBe(game.id);
    expect(dto.version).toBe(7);
    expect(dto.seed).toBe(game.seed);
    expect(dto.roundIndex).toBe(game.roundIndex);
    expect(dto.maxRounds).toBe(game.maxRounds);
    expect(typeof dto.rngState).toBe('number');
    expect(dto.players).toHaveLength(2);
    expect(dto.mainDeck.drawPile.length + dto.mainDeck.discardPile.length).toBe(
      game.mainDeck.totalSize,
    );
  });

  it('serializes tech tiles with canonical bonuses only', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 7);
    const tile = dto.techBoard?.stacks[0]?.tiles[0];

    expect(tile?.bonuses).toEqual(expect.any(Array));
    expect('bonus' in (tile ?? {})).toBe(false);
  });

  it('serializes signal tokens only in the canonical resources shape', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 7);
    const playerDto = dto.players[0] as (typeof dto.players)[number] & {
      resourceByType?: unknown;
    };

    expect(playerDto.resources.signalTokens).toBe(
      game.players[0].resources.signalTokens,
    );
    expect('resourceByType' in playerDto).toBe(false);
  });

  it('projects round counters for clients', () => {
    const game = createTestGame();
    const publicState = projectGameState(game, 'p1');

    expect(publicState.roundIndex).toBe(1);
    expect(publicState.maxRounds).toBe(5);
  });

  it('projects main deck sizes for free-action availability checks', () => {
    const game = createTestGame();
    game.mainDeck.drawN(2);
    game.mainDeck.discard('discarded-card');

    const publicState = projectGameState(game, 'p1');

    expect(publicState.mainDeck).toEqual({
      drawPileSize: game.mainDeck.drawSize,
      discardPileSize: game.mainDeck.discardSize,
    });
  });

  it('projects signal-token scan availability and spent count', () => {
    const game = Game.create(
      [
        { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
        { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
      ],
      {
        playerCount: 2,
        expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
        spaceAgencyOptions: {
          enabled: true,
          agencies: false,
          startResourceCards: false,
          newDeck: true,
          newAlienSpecies: false,
        },
      },
      'serializer-signal-token-scan',
      'serializer-signal-token-scan',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.resources.gain({ signalTokens: 3 });
    player.waitingFor = ScanActionPool.execute(player, game);
    recordScanSignalTokenSpend(player.waitingFor);
    recordScanSignalTokenSpend(player.waitingFor);

    const publicState = projectGameState(game, player.id);

    expect(publicState.spaceAgencyOptions?.newDeck).toBe(true);
    expect(publicState.scanActionInProgress).toBe(true);
    expect(publicState.scanSignalTokensSpent).toBe(2);
    expect(
      getAvailableFreeActions(publicState.players[0], publicState),
    ).not.toContain(EFreeAction.SPEND_SIGNAL_TOKEN);
  });

  it('serializes and projects setup-choice player fields only to the owning viewer', () => {
    const game = createTestGame();
    const player = game.players[0] as (typeof game.players)[number] & {
      setupChoiceContext: unknown;
      quickStartCardIds: string[];
    };
    player.quickStartCardIds = ['QS.1', 'QS.2'];
    player.setupChoiceContext = {
      currentStepIndex: 0,
      completed: false,
      steps: [
        {
          kind: ESetupChoiceStepKind.ORGANIZATION,
          title: 'Choose organization',
          minSelections: 1,
          maxSelections: 1,
          selectedIds: [],
          completed: false,
          candidates: [{ id: 'org-a', label: 'Org A', canChoose: true }],
        },
      ],
    };

    const dto = serializeGame(game, 2);
    const ownView = projectGameState(game, 'p1');
    const otherView = projectGameState(game, 'p2');

    expect(dto.players[0].quickStartCardIds).toEqual(['QS.1', 'QS.2']);
    expect(dto.players[0].setupChoiceContext).toMatchObject({
      currentStepIndex: 0,
      completed: false,
    });
    expect(ownView.players[0].quickStartCardIds).toEqual(['QS.1', 'QS.2']);
    expect(ownView.players[0].setupChoiceContext).toMatchObject({
      steps: [{ kind: ESetupChoiceStepKind.ORGANIZATION }],
    });
    expect(otherView.players[0].quickStartCardIds).toBeUndefined();
    expect(otherView.players[0].setupChoiceContext).toBeUndefined();
  });

  it('serializes and projects organization player fields safely', () => {
    const game = createTestGame();
    game.players[0].organizationIds = [EOrganizationId.ORBITAL_DYNAMICS];
    game.players[0].organizationState = {
      [EOrganizationId.ORBITAL_DYNAMICS]: { localOnly: true },
    };
    game.players[0].oncePerRoundUsed = {
      [EOrganizationId.ORBITAL_DYNAMICS]: false,
    };

    const dto = serializeGame(game, 2);
    const ownView = projectGameState(game, 'p1');
    const otherView = projectGameState(game, 'p2');

    expect(dto.players[0].organizationIds).toEqual([
      EOrganizationId.ORBITAL_DYNAMICS,
    ]);
    expect(dto.players[0].organizationState).toEqual({
      [EOrganizationId.ORBITAL_DYNAMICS]: { localOnly: true },
    });
    expect(ownView.players[0].organizationIds).toEqual([
      EOrganizationId.ORBITAL_DYNAMICS,
    ]);
    expect(ownView.players[0].organizationState).toEqual({
      [EOrganizationId.ORBITAL_DYNAMICS]: { localOnly: true },
    });
    expect(ownView.players[0].oncePerRoundUsed).toEqual({
      [EOrganizationId.ORBITAL_DYNAMICS]: false,
    });
    expect(ownView.players[0].actionCosts).toEqual({
      analyzeDataEnergy: 1,
      researchTechPublicity: 6,
    });
    expect(otherView.players[0].organizationIds).toEqual([
      EOrganizationId.ORBITAL_DYNAMICS,
    ]);
    expect(otherView.players[0].organizationState).toBeUndefined();
    expect(otherView.players[0].oncePerRoundUsed).toBeUndefined();
  });

  it('projects usable organization power ids only to the owning viewer', () => {
    const game = createTestGame();
    game.players[0].organizationIds = [EOrganizationId.STRATUS_CORE];
    game.players[0].oncePerRoundUsed = {
      [EOrganizationId.STRATUS_CORE]: false,
    };
    game.cardRow = [
      {
        id: '128',
        freeAction: [{ type: EResource.PUBLICITY, value: 1 }],
      } as never,
    ];

    const ownView = projectGameState(game, 'p1');
    const otherView = projectGameState(game, 'p2');

    expect(ownView.players[0].usableOrganizationPowerIds).toEqual([
      EOrganizationId.STRATUS_CORE,
    ]);
    expect(otherView.players[0].usableOrganizationPowerIds).toBeUndefined();
  });

  it('projects Futurespan preparation as usable after the round power was spent', () => {
    const game = createTestGame();
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.FUTURESPAN_INSTITUTE];
    player.organizationState = {
      [EOrganizationId.FUTURESPAN_INSTITUTE]: {},
    };
    player.oncePerRoundUsed = {
      [EOrganizationId.FUTURESPAN_INSTITUTE]: true,
    };
    player.hand = ['130'];

    const ownView = projectGameState(game, 'p1');

    expect(ownView.players[0].usableOrganizationPowerIds).toContain(
      EOrganizationId.FUTURESPAN_INSTITUTE,
    );
  });

  it('projects usable organization main-action ids only to the owning viewer', () => {
    const game = createTestGame();
    const player = game.players[0];
    player.organizationIds = [
      EOrganizationId.FUTURESPAN_INSTITUTE,
      EOrganizationId.XENOLAB,
    ];
    player.organizationState = {
      [EOrganizationId.FUTURESPAN_INSTITUTE]: {
        preparedCard: '130',
        preparedCardId: '130',
        unlockScore: 0,
      },
      [EOrganizationId.XENOLAB]: {
        tiles: { launch: false, scan: true, research: false },
      },
    };
    player.resources.gain({ energy: 2 });

    const ownView = projectGameState(game, 'p1');
    const otherView = projectGameState(game, 'p2');

    expect(ownView.players[0].usableOrganizationMainActionIds).toEqual([
      EOrganizationId.FUTURESPAN_INSTITUTE,
      EOrganizationId.XENOLAB,
    ]);
    expect(
      otherView.players[0].usableOrganizationMainActionIds,
    ).toBeUndefined();
  });

  it('serializes and projects public solo rival state without deck order', () => {
    const game = createSoloTestGame();
    game.players[1].gainTech(ETechId.PROBE_DOUBLE_PROBE);
    const dto = serializeGame(game, 3) as ReturnType<typeof serializeGame> & {
      rivalState?: {
        rivalPlayerId: string;
        difficulty: number;
        progress: number;
        actionDeck: { drawPile: string[] };
      };
    };

    expect(dto.rivalState).toMatchObject({
      rivalPlayerId: 'rival:game-serializer-solo',
      difficulty: 4,
      progress: 15,
    });
    expect(dto.rivalState?.actionDeck.drawPile).toHaveLength(5);

    const publicState = projectGameState(game, 'p1') as ReturnType<
      typeof projectGameState
    > & {
      isSoloMode?: boolean;
      rival?: {
        rivalPlayerId: string;
        difficulty: number;
        progress: number;
        actionDeck: { drawPileSize: number; discardPileSize: number };
      };
    };

    expect(publicState.isSoloMode).toBe(true);
    expect(publicState.rival).toMatchObject({
      rivalPlayerId: 'rival:game-serializer-solo',
      difficulty: 4,
      progress: 15,
      techIds: [ETechId.PROBE_DOUBLE_PROBE],
      actionDeck: {
        drawPileSize: 5,
        discardPileSize: 0,
      },
    });
    expect(publicState.rival?.computer.slotRewards).toEqual(
      RIVAL_COMPUTER_SLOT_REWARDS,
    );
    expect(publicState.rival).not.toHaveProperty('actionDeck.drawPile');
  });

  it('projects hidden information per viewer', () => {
    const game = createTestGame();
    game.processMainAction(game.activePlayer.id, { type: EMainAction.PASS });

    const p1View = projectGameState(game, 'p1');
    const p2ForP1 = p1View.players.find((player) => player.playerId === 'p2');
    expect(p2ForP1?.hand).toBeUndefined();
    expect(typeof p2ForP1?.handSize).toBe('number');

    const p2View = projectGameState(game, 'p2');
    const p2Self = p2View.players.find((player) => player.playerId === 'p2');
    expect(Array.isArray(p2Self?.hand)).toBe(true);
    expect(p2View.solarSystem.spaces.length).toBeGreaterThan(0);
  });

  it('projects public card zones as full card objects instead of id-only shapes', () => {
    const game = createTestGame();
    const player = game.players[0];
    game.cardRow = ['128'];
    player.hand = ['128'];
    player.tuckedIncomeCards = ['128'];
    player.playedMissions = ['128'];
    player.playedCards = ['128'];
    player.endGameCards = ['128'];

    const ownView = projectGameState(game, player.id);
    const ownPlayer = ownView.players.find(
      (candidate) => candidate.playerId === player.id,
    );

    expect(ownView.cardRow[0]).toMatchObject({
      id: '128',
      name: expect.any(String),
      price: expect.any(Number),
      income: expect.any(String),
      effects: expect.any(Array),
    });
    expect(ownPlayer?.hand?.[0]).toMatchObject(ownView.cardRow[0]);
    expect(ownPlayer?.tuckedIncomeCards?.[0]).toMatchObject(ownView.cardRow[0]);
    expect(ownPlayer?.playedMissions?.[0]).toMatchObject(ownView.cardRow[0]);
    expect(ownPlayer?.playedCards?.[0]).toMatchObject(ownView.cardRow[0]);
    expect(ownPlayer?.endGameCards?.[0]).toMatchObject(ownView.cardRow[0]);
  });

  it('does not project hidden end-of-round stack contents', () => {
    const game = createTestGame();
    expect(game.endOfRoundStacks[game.roundRotationReminderIndex].length).toBe(
      3,
    );

    const publicState = projectGameState(game, 'p1');

    expect(publicState.endOfRoundStacks).toBeUndefined();
    expect(publicState.endOfRoundStackCounts).toEqual([3, 3, 3, 3]);
    expect(publicState.currentEndOfRoundStackIndex).toBe(
      game.roundRotationReminderIndex,
    );

    game.processMainAction(game.activePlayer.id, { type: EMainAction.PASS });
    const model =
      game.players[0].waitingFor?.toModel() as ISelectEndOfRoundCardInputModel;

    expect(model.type).toBe(EPlayerInputType.END_OF_ROUND);
    expect(model.cards).toHaveLength(3);
    expect(projectGameState(game, 'p2').endOfRoundStacks).toBeUndefined();
  });

  it('projects Space Agency end-of-round stack counts without contents', () => {
    const game = Game.create(
      [
        { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
        { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
      ],
      createGameOptions({
        playerCount: 2,
        expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
        spaceAgencyOptions: {
          enabled: true,
          agencies: true,
          startResourceCards: true,
          newDeck: false,
          newAlienSpecies: false,
        },
      }),
      'serializer-space-agency-stacks',
      'game-serializer-space-agency-stacks',
    );

    const publicState = projectGameState(game, 'p1');

    expect(game.endOfRoundStacks).toHaveLength(3);
    expect(publicState.endOfRoundStacks).toBeUndefined();
    expect(publicState.endOfRoundStackCounts).toEqual([3, 3, 3]);
  });

  it('projects orbit and land as available when a probe is on a planet', () => {
    const game = createTestGame();
    const player = game.players[0];
    const marsSpace = game.solarSystem?.getSpacesOnPlanet(EPlanet.MARS)[0];
    if (!marsSpace || !game.solarSystem) {
      throw new Error('expected Mars space in solar system');
    }

    game.solarSystem.placeProbe(player.id, marsSpace.id);
    player.probesInSpace = 1;

    const publicState = projectGameState(game, player.id);
    const publicPlayer = publicState.players.find(
      (p) => p.playerId === player.id,
    );
    if (!publicPlayer) {
      throw new Error('expected projected player state');
    }

    const actions = getAvailableMainActions(publicPlayer, publicState);
    expect(actions).toContain(EMainAction.ORBIT);
    expect(actions).toContain(EMainAction.LAND);
  });

  it('projects the effective probe limit when double-probe tech is owned', () => {
    const game = createTestGame();
    const player = game.players[0];
    player.gainTech(ETechId.PROBE_DOUBLE_PROBE);
    player.probesInSpace = 2;

    const publicState = projectGameState(game, player.id);
    const publicPlayer = publicState.players.find(
      (p) => p.playerId === player.id,
    );

    expect(publicPlayer?.probeSpaceLimit).toBe(2);
  });

  it('projects completable quick mission branches only to the owning viewer', () => {
    const game = createTestGame();
    const player = game.players[0];
    player.hand = ['37'];

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    for (const sector of game.sectors.filter(
      (sector) => sector.color === ESector.RED,
    )) {
      sector.sectorWinners.push(player.id);
    }

    const selfView = projectGameState(game, player.id);
    const selfPlayer = selfView.players.find((p) => p.playerId === player.id);
    if (!selfPlayer) {
      throw new Error('expected projected self player');
    }

    expect(selfPlayer.completableMissionBranches).toEqual([
      { cardId: '37', branchIndex: 0 },
    ]);
    expect(getAvailableFreeActions(selfPlayer, selfView)).toContain(
      EFreeAction.COMPLETE_MISSION,
    );

    const opponentView = projectGameState(game, game.players[1].id);
    const hiddenPlayer = opponentView.players.find(
      (p) => p.playerId === player.id,
    );
    expect(hiddenPlayer?.completableMissionBranches).toBeUndefined();
  });

  it('does not persist redundant planetSpaceId inside planetary board state', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 7);

    expect(
      dto.planetaryBoard?.planets.every(
        (planet) => !('planetSpaceId' in planet.state),
      ),
    ).toBe(true);
  });

  it('persists alien components in explicit component fields', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.ANOMALIES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isAnomaliesAlienBoard(board)) {
      throw new Error('expected anomalies board');
    }
    board.discovered = true;
    board.addAnomalyColumn({
      slotId: 'alien-0-anomaly-column|red-trace',
      alienIndex: 0,
      traceColor: ETrace.PINK,
      maxOccupants: -1,
      rewards: [],
      isDiscovery: false,
    });
    game.solarSystem?.addAlienToken({
      tokenId: 'alien-0-anomaly-token|0|red-trace',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 0,
      traceColor: ETrace.PINK,
      rewards: [{ type: 'VP', amount: 4 }],
    });

    const dto = serializeGame(game, 7);
    const alien = dto.alienState.aliens[0];

    expect('slots' in alien).toBe(false);
    expect('anomalyTokens' in alien).toBe(false);
    expect(alien.discoverySlots).toHaveLength(3);
    expect(alien.overflowSlots).toHaveLength(3);
    expect(alien.speciesTraceSlots).toEqual([]);
    expect(alien.anomalyColumns?.map((slot) => slot.slotId)).toEqual([
      'alien-0-anomaly-column|red-trace',
    ]);
    expect(dto.solarSystem?.alienTokens).toEqual([
      {
        tokenId: 'alien-0-anomaly-token|0|red-trace',
        alienType: EAlienType.ANOMALIES,
        sectorIndex: 0,
        traceColor: ETrace.PINK,
        rewards: [{ type: 'VP', amount: 4 }],
      },
    ]);
  });

  it('projects undiscovered aliens with only discovery zones and overflow', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.ANOMALIES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isAnomaliesAlienBoard(board)) {
      throw new Error('expected anomalies board');
    }
    board.addAnomalyColumn({
      slotId: 'alien-0-anomaly-column|red-trace',
      alienIndex: 0,
      traceColor: ETrace.PINK,
      maxOccupants: -1,
      rewards: [],
      isDiscovery: false,
    });
    game.solarSystem?.addAlienToken({
      tokenId: 'alien-0-anomaly-token|0|red-trace',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 0,
      traceColor: ETrace.PINK,
      rewards: [{ type: 'VP', amount: 4 }],
    });

    const publicState = projectGameState(game, game.activePlayer.id);
    const publicAlien = publicState.aliens[0];

    expect(publicAlien.alienType).toBeNull();
    expect(publicAlien).not.toHaveProperty('slots');
    expect(publicAlien.board).toBeNull();
    expect(publicAlien.cardZone).toBeNull();
    expect(publicAlien.discovery.zones.map((slot) => slot.slotId)).toEqual([
      'alien-0-discovery-red-trace',
      'alien-0-discovery-yellow-trace',
      'alien-0-discovery-blue-trace',
    ]);
    expect(
      publicAlien.discovery.overflowZones.map((slot) => slot.slotId),
    ).toEqual([
      'alien-0-overflow-red-trace',
      'alien-0-overflow-yellow-trace',
      'alien-0-overflow-blue-trace',
    ]);
    expect(
      publicAlien.discovery.overflowZones.every(
        (slot) => slot.maxOccupants === -1,
      ),
    ).toBe(true);
    expect(publicState.solarSystem.alienTokens).toEqual([]);
  });

  it('projects discovered Anomalies as board columns, solar tokens, and a card zone', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.ANOMALIES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isAnomaliesAlienBoard(board)) {
      throw new Error('expected anomalies board');
    }
    board.discovered = true;
    board.alienDeckDrawPile = ['ET.12', 'ET.13'];
    board.alienDeckDiscardPile = ['ET.14'];
    board.faceUpAlienCardId = 'ET.11';

    for (const color of [ETrace.PINK, ETrace.YELLOW, ETrace.BLUE]) {
      board.addAnomalyColumn({
        slotId: `alien-0-anomaly-column|${color}`,
        alienIndex: 0,
        traceColor: color,
        maxOccupants: -1,
        rewards: [],
        isDiscovery: false,
      });
    }
    game.solarSystem?.addAlienToken({
      tokenId: 'alien-0-anomaly-token|3|red-trace',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 3,
      traceColor: ETrace.PINK,
      rewards: [{ type: 'VP', amount: 4 }],
    });

    const publicState = projectGameState(game, game.activePlayer.id);
    const publicAlien = publicState.aliens[0];

    expect(publicAlien).not.toHaveProperty('slots');
    expect(publicAlien.alienType).toBe(EAlienType.ANOMALIES);
    expect(publicAlien.cardZone).toEqual({
      faceUpCardId: 'ET.11',
      drawPileSize: 2,
      discardPileSize: 1,
    });
    if (!publicAlien.board || publicAlien.board.type !== 'anomalies') {
      throw new Error('expected anomalies public board');
    }
    expect(publicAlien.board.type).toBe('anomalies');
    expect(Object.keys(publicAlien.board.traceBoard.columns)).toEqual([
      ETrace.PINK,
      ETrace.YELLOW,
      ETrace.BLUE,
    ]);
    expect(publicState.solarSystem.alienTokens).toEqual([
      {
        tokenId: 'alien-0-anomaly-token|3|red-trace',
        alienType: EAlienType.ANOMALIES,
        sectorIndex: 3,
        traceColor: ETrace.PINK,
        rewards: [{ type: 'VP', amount: 4 }],
      },
    ]);
  });

  it('projects discovered Oumuamua tile state as a public board component', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.OUMUAMUA];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isOumuamuaAlienBoard(board)) {
      throw new Error('expected oumuamua board');
    }
    board.discovered = true;
    board.oumuamuaTile = {
      spaceId: 'ring-3-cell-5',
      sectorId: 'sector-2',
      dataRemaining: 2,
      markerPlayerIds: ['p1'],
    };

    const publicState = projectGameState(game, game.activePlayer.id);
    const publicAlien = publicState.aliens[0];

    expect(publicAlien.board).toMatchObject({
      type: 'oumuamua',
      tile: {
        spaceId: 'ring-3-cell-5',
        sectorId: 'sector-2',
        dataRemaining: 2,
        markerPlayerIds: ['p1'],
      },
    });
  });

  it('serializes and projects discovered Glyphids board state', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.GLYPHIDS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isGlyphidsAlienBoard(board)) {
      throw new Error('expected Glyphids board');
    }
    board.discovered = true;
    board.glyphRows = {
      p1: [[EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE]],
    };
    board.glyphTokenBank = [EAlienIcon.GLYPH_GREEN, EAlienIcon.GLYPH_GREEN];
    board.boardTokens = [
      { position: 0, glyph: EAlienIcon.GLYPH_RED },
      { position: 3, glyph: EAlienIcon.GLYPH_BLUE },
    ];
    board.placedTokens = [
      {
        tokenId: 'glyphids-token|planet|mars',
        glyph: EAlienIcon.GLYPH_GREEN,
        location: { type: 'planet', planet: EPlanet.MARS },
      },
      {
        tokenId: 'glyphids-token|sector|sector-2',
        glyph: EAlienIcon.GLYPH_YELLOW,
        location: { type: 'sector', sectorId: 'sector-2', sectorIndex: 2 },
      },
      {
        tokenId: 'glyphids-token|tech|scan-0',
        glyph: EAlienIcon.GLYPH_PURPLE,
        location: { type: 'tech', techId: ETechId.SCAN_EARTH_LOOK },
      },
    ];
    board.translationRows = [
      {
        rowId: 'glyphids-translation-level-1',
        level: 1,
        glyphs: [EAlienIcon.GLYPH_RED, null, null, null],
        side: 1,
      },
    ];

    const dto = serializeGame(game, 7);
    const publicState = projectGameState(game, 'p1');
    const publicAlien = publicState.aliens[0];

    expect(dto.alienState.aliens[0].glyphidsGlyphRows).toEqual({
      p1: [[EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE]],
    });
    expect(dto.alienState.aliens[0].glyphidsBoardTokens).toEqual([
      { position: 0, glyph: EAlienIcon.GLYPH_RED },
      { position: 3, glyph: EAlienIcon.GLYPH_BLUE },
    ]);
    expect(dto.alienState.aliens[0].glyphidsPlacedTokens).toEqual(
      board.placedTokens,
    );
    if (!publicAlien.board || publicAlien.board.type !== 'glyphids') {
      throw new Error('expected Glyphids public board');
    }
    expect(publicAlien.board.glyphRows).toEqual({
      p1: [[EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE]],
    });
    expect(publicAlien.board.glyphTokenBankSize).toBe(2);
    expect(publicAlien.board.boardTokens).toEqual([
      { position: 0, glyph: EAlienIcon.GLYPH_RED },
      { position: 3, glyph: EAlienIcon.GLYPH_BLUE },
    ]);
    expect(publicAlien.board.placedTokens).toEqual(board.placedTokens);
    expect(publicState.solarSystem.alienTokens).toEqual([]);
    expect(publicState.solarSystem.glyphidsSectorTokens).toEqual([
      {
        tokenId: 'glyphids-token|sector|sector-2',
        alienType: EAlienType.GLYPHIDS,
        sectorId: 'sector-2',
        sectorIndex: 2,
        glyph: EAlienIcon.GLYPH_YELLOW,
      },
    ]);
    expect(
      publicState.planetaryBoard.planets[EPlanet.MARS]?.alienTokens,
    ).toEqual([
      {
        tokenId: 'glyphids-token|planet|mars',
        alienType: EAlienType.GLYPHIDS,
        glyph: EAlienIcon.GLYPH_GREEN,
      },
    ]);
    expect(
      publicState.techBoard.stacks.find(
        (stack) => stack.tech === ETech.SCAN && stack.level === 0,
      )?.alienTokens,
    ).toEqual([
      {
        tokenId: 'glyphids-token|tech|scan-0',
        alienType: EAlienType.GLYPHIDS,
        glyph: EAlienIcon.GLYPH_PURPLE,
      },
    ]);
    expect(publicAlien.board.translationRows).toEqual([
      {
        rowId: 'glyphids-translation-level-1',
        level: 1,
        glyphs: [EAlienIcon.GLYPH_RED, null, null, null],
        side: 1,
      },
    ]);
  });

  it('serializes and projects discovered Amoeba board state', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.AMOEBA];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isAmoebaAlienBoard(board)) {
      throw new Error('expected Amoeba board');
    }
    board.discovered = true;
    board.organelles = [
      {
        tokenId: 'amoeba-organelle-0',
        color: EAlienIcon.ORGANELLE_RED,
        position: 8,
      },
    ];
    board.addTraceSlot({
      slotId: 'alien-0-amoeba-red-0',
      alienIndex: board.alienIndex,
      traceColor: ETrace.PINK,
      maxOccupants: 1,
      rewards: [{ type: 'VP', amount: 3 }],
      isDiscovery: false,
    });

    const dto = serializeGame(game, 7);
    const publicState = projectGameState(game, 'p1');
    const publicAlien = publicState.aliens[0];

    expect(dto.alienState.aliens[0].amoebaOrganelles).toEqual([
      {
        tokenId: 'amoeba-organelle-0',
        color: EAlienIcon.ORGANELLE_RED,
        position: 8,
      },
    ]);
    if (!publicAlien.board || publicAlien.board.type !== 'amoeba') {
      throw new Error('expected Amoeba public board');
    }
    expect(publicAlien.board.organelles).toEqual([
      {
        tokenId: 'amoeba-organelle-0',
        color: EAlienIcon.ORGANELLE_RED,
        position: 8,
      },
    ]);
    expect(publicAlien.board.traceSlots).toEqual([
      expect.objectContaining({ slotId: 'alien-0-amoeba-red-0' }),
    ]);
  });

  it('serializes and projects discovered Arkhos board state', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.ARKHOS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isArkhosAlienBoard(board)) {
      throw new Error('expected Arkhos board');
    }
    board.discovered = true;
    board.explorationDrawPile = ['ARKHOS.EXPLORATION.1'];
    board.explorationReservePile = ['ARKHOS.EXPLORATION.2'];
    board.explorationDiscardPile = ['ARKHOS.EXPLORATION.3'];
    board.securityCardsByPlayer = {
      p1: [{ cardId: 'AIcard01', traceColor: ETrace.PINK, zone: 'hand' }],
    };
    board.accessByPlayer = {
      p1: { breachedCount: 1, accessLevel: 1 },
    };
    board.resolvedExplorationRewards = [
      {
        playerId: 'p1',
        cardId: 'ARKHOS.EXPLORATION.3',
        size: 'minor',
        effectId: 'ARKHOS_EXPLORATION_03_MINOR_UNMAPPED',
      },
    ];
    board.addTraceSlot({
      slotId: 'alien-0-arkhos-level-1-0-red-trace',
      alienIndex: board.alienIndex,
      traceColor: ETrace.PINK,
      maxOccupants: 1,
      rewards: [{ type: 'CUSTOM', effectId: 'ARKHOS_LEVEL_1_EXPLORATION' }],
      isDiscovery: false,
    });

    const dto = serializeGame(game, 7);
    const publicState = projectGameState(game, 'p1');
    const publicAlien = publicState.aliens[0];

    expect(dto.alienState.aliens[0].arkhosExplorationDrawPile).toEqual([
      'ARKHOS.EXPLORATION.1',
    ]);
    if (!publicAlien.board || publicAlien.board.type !== 'arkhos') {
      throw new Error('expected Arkhos public board');
    }
    expect(publicAlien.board).toMatchObject({
      explorationDeckSize: 1,
      explorationReserveSize: 1,
      explorationDiscardSize: 1,
      securityCardsByPlayer: {
        p1: [{ cardId: 'AIcard01', traceColor: ETrace.PINK, zone: 'hand' }],
      },
      accessByPlayer: {
        p1: { breachedCount: 1, accessLevel: 1 },
      },
      resolvedExplorationRewards: [
        {
          playerId: 'p1',
          cardId: 'ARKHOS.EXPLORATION.3',
          size: 'minor',
          effectId: 'ARKHOS_EXPLORATION_03_MINOR_UNMAPPED',
        },
      ],
    });
    expect(publicAlien.board.traceSlots).toEqual([
      expect.objectContaining({
        slotId: 'alien-0-arkhos-level-1-0-red-trace',
      }),
    ]);
  });

  it('projects Mascamites capsules as generic solar-system movable pieces', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.MASCAMITES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isMascamitesAlienBoard(board)) {
      throw new Error('expected Mascamites board');
    }
    board.discovered = true;
    board.createCapsule({
      capsuleId: 'capsule-1',
      ownerId: 'p1',
      sampleTokenId: 'mascamites-credit-2',
      sourcePlanet: EPlanet.JUPITER,
      spaceId: 'ring-2-cell-1',
    });

    const publicState = projectGameState(game, 'p1');

    expect(publicState.solarSystem.movablePieces).toContainEqual({
      pieceId: 'capsule-1',
      pieceType: 'mascamites-capsule',
      playerId: 'p1',
      spaceId: 'ring-2-cell-1',
      movementTarget: { type: 'mascamites-capsule', id: 'capsule-1' },
    });
  });

  it('projects Mascamites board without leaking hidden sample identities', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.MASCAMITES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isMascamitesAlienBoard(board)) {
      throw new Error('expected Mascamites board');
    }
    board.discovered = true;
    board.samplePools.jupiter = ['mascamites-credit-2', 'mascamites-energy-2'];
    board.samplePools.saturn = ['mascamites-card-2'];
    board.publicSamples = ['mascamites-vp-7'];
    board.capsules = [
      {
        capsuleId: 'capsule-1',
        ownerId: 'p1',
        sampleTokenId: 'mascamites-credit-2',
        sourcePlanet: EPlanet.JUPITER,
        spaceId: 'ring-2-cell-1',
        missionCardId: 'ET.1',
      },
    ];
    board.deliveredSamples = [
      {
        sampleTokenId: 'mascamites-vp-7',
        deliveredBy: 'p2',
        deliveredAtRound: 3,
        slotId: 'alien-0-mascamites-sample-blue-0',
      },
    ];
    board.addTraceSlot({
      slotId: 'alien-0-mascamites-sample-blue-0',
      alienIndex: board.alienIndex,
      traceColor: ETrace.BLUE,
      maxOccupants: 1,
      rewards: [{ type: 'VP', amount: 7 }],
      isDiscovery: false,
    });

    const publicState = projectGameState(game, 'p1');
    const publicAlien = publicState.aliens[0];

    if (!publicAlien.board || publicAlien.board.type !== 'mascamites') {
      throw new Error('expected Mascamites public board');
    }
    expect(publicAlien.board.samplePools).toEqual({
      jupiter: 2,
      saturn: 1,
    });
    expect(publicAlien.board.publicSamples).toEqual(['mascamites-vp-7']);
    expect(publicAlien.board.capsules).toEqual([
      {
        capsuleId: 'capsule-1',
        ownerId: 'p1',
        sourcePlanet: EPlanet.JUPITER,
        spaceId: 'ring-2-cell-1',
        missionCardId: 'ET.1',
      },
    ]);
    expect(publicAlien.board.deliveredSamples).toEqual([
      {
        sampleTokenId: 'mascamites-vp-7',
        deliveredBy: 'p2',
        deliveredAtRound: 3,
        slotId: 'alien-0-mascamites-sample-blue-0',
      },
    ]);
    expect(publicAlien.board.traceSlots).toEqual([
      expect.objectContaining({
        slotId: 'alien-0-mascamites-sample-blue-0',
        traceColor: ETrace.BLUE,
      }),
    ]);
    expect(JSON.stringify(publicAlien.board)).not.toContain(
      'mascamites-credit-2',
    );
    expect(JSON.stringify(publicAlien.board)).not.toContain(
      'mascamites-energy-2',
    );
    expect(JSON.stringify(publicAlien.board)).not.toContain(
      'mascamites-card-2',
    );
  });

  it('projects Exertians face-down cards without leaking card ids or danger values', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.EXERTIANS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isExertiansAlienBoard(board)) {
      throw new Error('expected Exertians board');
    }
    board.discovered = true;
    board.playFaceDownCard('p1', 'ET.52', 'discovery');
    board.playFaceDownCard('p2', 'ET.53', 'milestone-20');

    const publicState = projectGameState(game, 'p1');
    const publicAlien = publicState.aliens[0];

    if (!publicAlien.board || publicAlien.board.type !== 'exertians') {
      throw new Error('expected Exertians public board');
    }
    expect(publicAlien.board.faceDownCards).toEqual([
      { ownerId: 'p1', source: 'discovery', revealed: false },
      { ownerId: 'p2', source: 'milestone-20', revealed: false },
    ]);
    expect(JSON.stringify(publicAlien.board)).not.toContain('ET.52');
    expect(JSON.stringify(publicAlien.board)).not.toContain('danger');
  });

  it('projects revealed Exertians face-down cards with their card ids', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.EXERTIANS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isExertiansAlienBoard(board)) {
      throw new Error('expected Exertians board');
    }
    board.discovered = true;
    const played = board.playFaceDownCard('p1', 'ET.52', 'discovery');
    played.revealed = true;

    const publicState = projectGameState(game, 'p1');
    const publicAlien = publicState.aliens[0];

    if (!publicAlien.board || publicAlien.board.type !== 'exertians') {
      throw new Error('expected Exertians public board');
    }
    expect(publicAlien.board.faceDownCards).toEqual([
      {
        ownerId: 'p1',
        source: 'discovery',
        revealed: true,
        cardId: 'ET.52',
      },
    ]);
  });

  it('projects Centaurians message milestones as public board state', () => {
    const game = createTestGame();
    game.hiddenAliens = [EAlienType.CENTAURIANS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.boards[0];
    if (!isCentauriansAlienBoard(board)) {
      throw new Error('expected Centaurians board');
    }
    board.discovered = true;
    board.messageMilestones = [
      {
        playerId: 'p1',
        threshold: 27,
        sourceCardId: null,
        resolved: false,
      },
      {
        playerId: 'p2',
        threshold: 34,
        sourceCardId: 'ET.31',
        resolved: false,
      },
    ];
    board.pendingMessagesByPlayer = { p1: [], p2: ['ET.31'] };
    const firstRewardSlot = board.rewardSlots[0];
    if (!firstRewardSlot) {
      throw new Error('expected Centaurians reward slot');
    }
    firstRewardSlot.claimedByPlayerId = 'p1';

    const publicState = projectGameState(game, 'p1');
    const publicAlien = publicState.aliens[0];

    if (!publicAlien.board || publicAlien.board.type !== 'centaurians') {
      throw new Error('expected Centaurians public board');
    }
    expect(publicAlien.board.messageMilestones).toEqual([
      {
        playerId: 'p1',
        threshold: 27,
        sourceCardId: null,
        resolved: false,
      },
      {
        playerId: 'p2',
        threshold: 34,
        sourceCardId: 'ET.31',
        resolved: false,
      },
    ]);
    expect(publicAlien.board.pendingMessagesByPlayer).toEqual({
      p1: [],
      p2: ['ET.31'],
    });
    expect(publicAlien.board.rewardSlots[0]).toEqual(
      expect.objectContaining({
        slotId: 'any-trace',
        claimedByPlayerId: 'p1',
      }),
    );
  });
});
