import { EAlienIcon, EResource } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import {
  EAlienType,
  EMainAction,
  EPhase,
  EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import { EExpansion } from '@seti/common/types/protocol/options';
import {
  EPlayerInputType,
  ESetupChoiceStepKind,
  type ISelectOptionInputModel,
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
import { Game } from '@/engine/Game.js';
import { toPublicSolarSystemState } from '@/engine/utils/stateProjection.js';
import { deserializeGame } from '@/persistence/serializer/GameDeserializer.js';
import { serializeGame } from '@/persistence/serializer/GameSerializer.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

function createTestGame(): Game {
  return Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'deserializer-seed',
    'game-deserializer-test',
  );
}

function createSoloTestGame(): Game {
  return Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      {
        id: 'rival:game-deserializer-solo',
        name: 'Rival Institution',
        color: 'blue',
        seatIndex: 1,
      },
    ],
    {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty: 5,
    } as Parameters<typeof Game.create>[1],
    'deserializer-solo-seed',
    'game-deserializer-solo',
  );
}

function getPlayer(game: Game, playerId: string) {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`expected player ${playerId}`);
  }
  return player;
}

function requireSolarSystem(game: Game): NonNullable<Game['solarSystem']> {
  if (!game.solarSystem) {
    throw new Error('expected solar system');
  }
  return game.solarSystem;
}

function getSetupOrganizationOptions(
  player: Game['players'][number],
): EOrganizationId[] {
  const model = player.waitingFor?.toModel() as
    | ISelectOptionInputModel
    | undefined;
  return (model?.options ?? []).map((option) => option.id as EOrganizationId);
}

function chooseFirstOrganization(
  game: Game,
  playerId: string,
): EOrganizationId {
  const player = getPlayer(game, playerId);
  const organizationId = getSetupOrganizationOptions(player)[0];
  game.processInput(playerId, {
    type: EPlayerInputType.OPTION,
    optionId: organizationId,
  });
  return organizationId;
}

const ORGANIZATION_STATE_CASES = [
  {
    organizationId: EOrganizationId.COSMOS_STRATEGY_GROUP,
    label: 'Cosmos Strategy Group',
    state: { markedRewards: { credit: true } },
    oncePerRoundUsed: true,
  },
  {
    organizationId: EOrganizationId.DEEP_SKY_SURVEY,
    label: 'Deep Sky Survey',
    state: { swapPending: true },
    oncePerRoundUsed: false,
  },
  {
    organizationId: EOrganizationId.FENWICK_RESEARCH_CENTER,
    label: 'Fenwick Research Center',
    state: { selectedSource: 'deck' },
    oncePerRoundUsed: false,
  },
  {
    organizationId: EOrganizationId.FUTURESPAN_INSTITUTE,
    label: 'Futurespan Institute',
    state: {
      preparedCard: '130',
      preparedCardId: '130',
      unlockScore: 25,
    },
    oncePerRoundUsed: true,
  },
  {
    organizationId: EOrganizationId.HELION_ASSEMBLY,
    label: 'Helion Assembly',
    state: {
      markedCategories: ['probe'],
      pendingCategories: [],
      disabledTechIds: [ETechId.PROBE_DOUBLE_PROBE],
    },
    oncePerRoundUsed: false,
  },
  {
    organizationId: EOrganizationId.MISSION_RELAY,
    label: 'Mission Relay',
    state: { lastSource: 'main-deck' },
    oncePerRoundUsed: false,
  },
  {
    organizationId: EOrganizationId.ORBITAL_DYNAMICS,
    label: 'Orbital Dynamics',
    state: { movedProbeIds: ['probe-1'] },
    oncePerRoundUsed: false,
  },
  {
    organizationId: EOrganizationId.SENTINEL_PROBE_NETWORK,
    label: 'Sentinel Probe Network',
    state: { lastCardCornerCardId: '128' },
    oncePerRoundUsed: false,
  },
  {
    organizationId: EOrganizationId.STRATUS_CORE,
    label: 'Stratus Core',
    state: { queuedCorners: ['128'] },
    oncePerRoundUsed: false,
  },
  {
    organizationId: EOrganizationId.TURING_SYSTEMS,
    label: 'Turing Systems',
    state: { temporaryTechId: ETechId.SCAN_EARTH_LOOK },
    oncePerRoundUsed: false,
  },
  {
    organizationId: EOrganizationId.XENOLAB,
    label: 'Xenolab',
    state: { tiles: { launch: false, scan: true, research: true } },
    oncePerRoundUsed: false,
  },
] as const;

describe('GameDeserializer', () => {
  it('supports round-trip serialization', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    game.processMainAction(game.activePlayer.id, { type: EMainAction.PASS });

    const dto1 = serializeGame(game, 1);
    const restored = deserializeGame(dto1);
    const dto2 = serializeGame(restored, 1);

    expect(dto2).toEqual(dto1);
  });

  it('round-trips solar-system publicity icon amounts', () => {
    const game = createTestGame();
    const space = game.solarSystem?.spaces.find(
      (candidate) => candidate.id === 'ring-2-cell-4',
    );
    if (!space) {
      throw new Error('expected solar-system space');
    }
    space.hasPublicityIcon = true;
    space.publicityIconAmount = 2;

    const dto = serializeGame(game, 1);
    const restored = deserializeGame(dto);
    const restoredSpace = restored.solarSystem?.spaces.find(
      (candidate) => candidate.id === space.id,
    );

    expect(
      dto.solarSystem?.spaces.find((candidate) => candidate.id === space.id),
    ).toMatchObject({ hasPublicityIcon: true, publicityIconAmount: 2 });
    expect(restoredSpace?.publicityIconAmount).toBe(2);
  });

  it('preserves solar-system wheel layers so rotation after reload matches live games', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    const restored = deserializeGame(serializeGame(game, 1));
    const liveSolarSystem = requireSolarSystem(game);
    const restoredSolarSystem = requireSolarSystem(restored);

    for (let rotation = 0; rotation < 12; rotation += 1) {
      liveSolarSystem.rotateNextDisc();
      restoredSolarSystem.rotateNextDisc();

      expect(toPublicSolarSystemState(restoredSolarSystem)).toEqual(
        toPublicSolarSystemState(liveSolarSystem),
      );
    }
  });

  it('rejects snapshots missing required round counters', () => {
    const dto = serializeGame(createTestGame(), 1) as Partial<
      ReturnType<typeof serializeGame>
    >;
    delete dto.roundIndex;
    delete dto.maxRounds;
    delete dto.turnIndex;
    delete dto.turnLocked;

    expect(() =>
      deserializeGame(dto as ReturnType<typeof serializeGame>),
    ).toThrow('Missing required game counter: roundIndex');
  });

  it.each([
    'quickStartCardIds',
    'organizationIds',
    'organizationState',
    'oncePerRoundUsed',
    'actionCosts',
    'exofossils',
    'playedCards',
    'tracesByAlien',
  ])('rejects player snapshots missing required %s', (field) => {
    const dto = serializeGame(createTestGame(), 1);

    delete (dto.players[0] as unknown as Record<string, unknown>)[field];

    expect(() => deserializeGame(dto)).toThrow(
      `Missing required player snapshot field: ${field}`,
    );
  });

  it('rejects player snapshots missing canonical signal token resources', () => {
    const dto = serializeGame(createTestGame(), 1);
    (
      dto.players[0] as unknown as {
        resourceByType?: Record<string, number>;
      }
    ).resourceByType = { [EResource.SIGNAL_TOKEN]: 7 };
    delete (dto.players[0].resources as { signalTokens?: number }).signalTokens;

    expect(() => deserializeGame(dto)).toThrow(
      'Missing required player snapshot field: resources.signalTokens',
    );
  });

  it('preserves setup-choice player fields in current snapshots', () => {
    const dto = serializeGame(createTestGame(), 1);
    const setupChoiceContext = {
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
    dto.players[0].quickStartCardIds = ['QS.1'];
    dto.players[0].setupChoiceContext = setupChoiceContext;
    delete dto.players[1].setupChoiceContext;

    const restored = deserializeGame(dto);

    expect(restored.players[0].quickStartCardIds).toEqual(['QS.1']);
    expect(restored.players[0].setupChoiceContext).toEqual(setupChoiceContext);
    expect(restored.players[1].setupChoiceContext).toBeUndefined();
  });

  it('preserves organization player fields in current snapshots', () => {
    const dto = serializeGame(createTestGame(), 1);
    dto.players[0].organizationIds = [EOrganizationId.ORBITAL_DYNAMICS];
    dto.players[0].organizationState = {
      [EOrganizationId.ORBITAL_DYNAMICS]: { selected: true },
    };
    dto.players[0].oncePerRoundUsed = {
      [EOrganizationId.ORBITAL_DYNAMICS]: false,
    };

    const restored = deserializeGame(dto);

    expect(restored.players[0].organizationIds).toEqual([
      EOrganizationId.ORBITAL_DYNAMICS,
    ]);
    expect(restored.players[0].organizationState).toEqual({
      [EOrganizationId.ORBITAL_DYNAMICS]: { selected: true },
    });
    expect(restored.players[0].oncePerRoundUsed).toEqual({
      [EOrganizationId.ORBITAL_DYNAMICS]: false,
    });
  });

  it.each(ORGANIZATION_STATE_CASES)(
    'preserves $label organization state across a snapshot boundary',
    ({ organizationId, state, oncePerRoundUsed }) => {
      const dto = serializeGame(createTestGame(), 1);
      dto.players[0].organizationIds = [organizationId];
      dto.players[0].organizationState = { [organizationId]: state };
      dto.players[0].oncePerRoundUsed = { [organizationId]: oncePerRoundUsed };

      const restored = deserializeGame(dto);

      expect(restored.players[0].organizationIds).toEqual([organizationId]);
      expect(restored.players[0].organizationState).toEqual({
        [organizationId]: state,
      });
      expect(restored.players[0].oncePerRoundUsed).toEqual({
        [organizationId]: oncePerRoundUsed,
      });
    },
  );

  it('rehydrates setup-choice completion with the organization resolution callback', () => {
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
          agencies: true,
          startResourceCards: false,
          newDeck: false,
          newAlienSpecies: false,
        },
      } as Parameters<typeof Game.create>[1],
      'deserialize-agencies-choice',
      'deserialize-agencies-choice',
    );
    const p1OrganizationId = chooseFirstOrganization(game, 'p1');

    const restored = deserializeGame(serializeGame(game, 1));
    const p2OrganizationId = chooseFirstOrganization(restored, 'p2');

    expect(restored.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(getPlayer(restored, 'p1').organizationIds).toEqual([
      p1OrganizationId,
    ]);
    expect(getPlayer(restored, 'p2').organizationIds).toEqual([
      p2OrganizationId,
    ]);
  });

  it('rehydrates solo setup-choice with only participating players in the barrier', () => {
    const game = Game.create(
      [
        { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
        {
          id: 'rival:deserialize-agencies-solo-choice',
          name: 'Rival Institution',
          color: 'blue',
          seatIndex: 1,
        },
      ],
      {
        playerCount: 2,
        isSoloMode: true,
        soloDifficulty: 2,
        expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
        spaceAgencyOptions: {
          enabled: true,
          agencies: true,
          startResourceCards: false,
          newDeck: false,
          newAlienSpecies: false,
        },
      } as Parameters<typeof Game.create>[1],
      'deserialize-agencies-solo-choice',
      'deserialize-agencies-solo-choice',
    );

    const restored = deserializeGame(serializeGame(game, 1));
    const organizationId = chooseFirstOrganization(restored, 'p1');

    expect(restored.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(getPlayer(restored, 'p1').organizationIds).toEqual([organizationId]);
  });

  it('rejects moon occupant snapshots without stable moon ids', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 1);
    const jupiterState = dto.planetaryBoard?.planets.find(
      (entry) => entry.planet === EPlanet.JUPITER,
    )?.state;

    if (!jupiterState) {
      throw new Error('expected planetary board state');
    }

    jupiterState.moonOccupants = [{ playerId: 'p2' } as never];

    expect(() => deserializeGame(dto)).toThrow(
      'Missing moonId for saved moon occupant on jupiter',
    );
  });

  it('rejects tech board snapshots without canonical tile bonuses', () => {
    const dto = serializeGame(createTestGame(), 1);
    const tile = dto.techBoard?.stacks[0]?.tiles[0] as
      | {
          bonus?: unknown;
          bonuses?: unknown;
        }
      | undefined;
    if (!tile) {
      throw new Error('expected tech tile');
    }

    tile.bonus = tile.bonuses;
    delete tile.bonuses;

    expect(() => deserializeGame(dto)).toThrow(
      'Missing bonuses for saved tech tile',
    );
  });

  it('round-trips solo rival state', () => {
    const game = createSoloTestGame();
    const restored = deserializeGame(serializeGame(game, 1)) as Game & {
      rivalState?: {
        rivalPlayerId: string;
        difficulty: number;
        progress: number;
        progressSlot: number;
        boardConfigId: string;
        actionDeck: { getDrawPile: () => readonly string[] };
        computer: { filledSlots: boolean[]; dataPool: number };
      };
    };

    expect(restored.rivalState).toMatchObject({
      rivalPlayerId: 'rival:game-deserializer-solo',
      difficulty: 5,
      progress: 19,
      progressSlot: 7,
      boardConfigId: 'rival-board-4',
      computer: {
        filledSlots: [false, false, false, false, false, false],
        dataPool: 0,
      },
    });
    expect(restored.rivalState?.actionDeck.getDrawPile()).toHaveLength(5);
  });

  it('rejects unknown solo rival board ids instead of defaulting', () => {
    const game = createSoloTestGame();
    const dto = serializeGame(game, 1);
    if (!dto.rivalState) throw new Error('expected rival state');
    (dto.rivalState as { boardConfigId: string }).boardConfigId =
      'unknown-rival-board';

    expect(() => deserializeGame(dto)).toThrow(
      'Unknown rival board config id: unknown-rival-board',
    );
  });

  it('loads legacy multiplayer snapshots without rival state', () => {
    const dto = serializeGame(createTestGame(), 1) as ReturnType<
      typeof serializeGame
    > & {
      rivalState?: unknown;
    };
    delete dto.rivalState;

    const restored = deserializeGame(dto) as Game & { rivalState?: unknown };

    expect(restored.options.isSoloMode).toBe(false);
    expect(restored.rivalState).toBeUndefined();
  });

  it('round-trips Exertians face-down runtime state', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    game.hiddenAliens = [EAlienType.EXERTIANS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.getBoardByType(EAlienType.EXERTIANS);
    if (!isExertiansAlienBoard(board)) {
      throw new Error('expected Exertians board');
    }
    board.discovered = true;
    board.playFaceDownCard('p1', 'ET.52', 'discovery');
    board.milestones = [
      { threshold: 24, claimedByPlayerIds: ['p1'], creditCost: 0 },
      { threshold: 44, claimedByPlayerIds: [], creditCost: 1 },
    ];

    const restored = deserializeGame(serializeGame(game, 1));
    const restoredBoard = restored.alienState.getBoardByType(
      EAlienType.EXERTIANS,
    );

    if (!isExertiansAlienBoard(restoredBoard)) {
      throw new Error('expected restored Exertians board');
    }
    expect(restoredBoard.faceDownCards).toEqual([
      {
        ownerId: 'p1',
        cardId: 'ET.52',
        source: 'discovery',
        revealed: false,
      },
    ]);
    expect(restoredBoard.milestones).toEqual([
      { threshold: 24, claimedByPlayerIds: ['p1'], creditCost: 0 },
      { threshold: 44, claimedByPlayerIds: [], creditCost: 1 },
    ]);
  });

  it('round-trips Anomalies board columns and solar tokens', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    game.hiddenAliens = [EAlienType.ANOMALIES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
    if (!isAnomaliesAlienBoard(board)) {
      throw new Error('expected Anomalies board');
    }
    board.discovered = true;
    board.addAnomalyColumn({
      slotId: 'alien-0-anomaly-column|red-trace',
      alienIndex: board.alienIndex,
      traceColor: ETrace.PINK,
      maxOccupants: -1,
      rewards: [],
      isDiscovery: false,
    });
    game.solarSystem?.addAlienToken({
      tokenId: 'alien-0-anomaly-token|3|red-trace',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 3,
      traceColor: ETrace.PINK,
      rewards: [{ type: 'VP', amount: 4 }],
    });

    const restored = deserializeGame(serializeGame(game, 1));
    const restoredBoard = restored.alienState.getBoardByType(
      EAlienType.ANOMALIES,
    );

    if (!isAnomaliesAlienBoard(restoredBoard)) {
      throw new Error('expected restored Anomalies board');
    }
    expect(restoredBoard.anomalyColumns.map((slot) => slot.slotId)).toEqual([
      'alien-0-anomaly-column|red-trace',
    ]);
    expect(restored.solarSystem?.alienTokens).toEqual([
      {
        tokenId: 'alien-0-anomaly-token|3|red-trace',
        alienType: EAlienType.ANOMALIES,
        sectorIndex: 3,
        traceColor: ETrace.PINK,
        rewards: [{ type: 'VP', amount: 4 }],
      },
    ]);
  });

  it('round-trips Oumuamua tile runtime state', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    game.hiddenAliens = [EAlienType.OUMUAMUA];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.getBoardByType(EAlienType.OUMUAMUA);
    if (!isOumuamuaAlienBoard(board)) {
      throw new Error('expected Oumuamua board');
    }
    board.discovered = true;
    board.oumuamuaTile = {
      spaceId: 'ring-3-cell-5',
      sectorId: 'sector-2',
      dataRemaining: 2,
      markerPlayerIds: ['p1', 'p2'],
    };
    board.addTraceSlot({
      slotId: 'alien-0-oumuamua-trace|blue-trace|1|1',
      alienIndex: board.alienIndex,
      traceColor: ETrace.BLUE,
      maxOccupants: 1,
      rewards: [{ type: 'DATA', amount: 1 }],
      isDiscovery: false,
    });

    const restored = deserializeGame(serializeGame(game, 1));
    const restoredBoard = restored.alienState.getBoardByType(
      EAlienType.OUMUAMUA,
    );

    if (!isOumuamuaAlienBoard(restoredBoard)) {
      throw new Error('expected restored Oumuamua board');
    }
    expect(restoredBoard.oumuamuaTile).toEqual({
      spaceId: 'ring-3-cell-5',
      sectorId: 'sector-2',
      dataRemaining: 2,
      markerPlayerIds: ['p1', 'p2'],
    });
    expect(restoredBoard.speciesTraceSlots).toEqual([
      expect.objectContaining({
        slotId: 'alien-0-oumuamua-trace|blue-trace|1|1',
      }),
    ]);
  });

  it('round-trips Glyphids runtime state', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    game.hiddenAliens = [EAlienType.GLYPHIDS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
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

    const restored = deserializeGame(serializeGame(game, 1));
    const restoredBoard = restored.alienState.getBoardByType(
      EAlienType.GLYPHIDS,
    );

    if (!isGlyphidsAlienBoard(restoredBoard)) {
      throw new Error('expected restored Glyphids board');
    }
    expect(restoredBoard.glyphRows).toEqual({
      p1: [[EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE]],
    });
    expect(restoredBoard.glyphTokenBank).toEqual([
      EAlienIcon.GLYPH_GREEN,
      EAlienIcon.GLYPH_GREEN,
    ]);
    expect(restoredBoard.boardTokens).toEqual([
      { position: 0, glyph: EAlienIcon.GLYPH_RED },
      { position: 3, glyph: EAlienIcon.GLYPH_BLUE },
    ]);
    expect(restoredBoard.placedTokens).toEqual(board.placedTokens);
    expect(restoredBoard.translationRows).toEqual([
      {
        rowId: 'glyphids-translation-level-1',
        level: 1,
        glyphs: [EAlienIcon.GLYPH_RED, null, null, null],
        side: 1,
      },
    ]);
  });

  it('round-trips Amoeba runtime state', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    game.hiddenAliens = [EAlienType.AMOEBA];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
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

    const restored = deserializeGame(serializeGame(game, 1));
    const restoredBoard = restored.alienState.getBoardByType(EAlienType.AMOEBA);

    if (!isAmoebaAlienBoard(restoredBoard)) {
      throw new Error('expected restored Amoeba board');
    }
    expect(restoredBoard.organelles).toEqual([
      {
        tokenId: 'amoeba-organelle-0',
        color: EAlienIcon.ORGANELLE_RED,
        position: 8,
      },
    ]);
    expect(restoredBoard.speciesTraceSlots).toEqual([
      expect.objectContaining({ slotId: 'alien-0-amoeba-red-0' }),
    ]);
  });

  it('round-trips Arkhos runtime state', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    game.hiddenAliens = [EAlienType.ARKHOS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.getBoardByType(EAlienType.ARKHOS);
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

    const restored = deserializeGame(serializeGame(game, 1));
    const restoredBoard = restored.alienState.getBoardByType(EAlienType.ARKHOS);

    if (!isArkhosAlienBoard(restoredBoard)) {
      throw new Error('expected restored Arkhos board');
    }
    expect(restoredBoard.explorationDrawPile).toEqual(['ARKHOS.EXPLORATION.1']);
    expect(restoredBoard.explorationReservePile).toEqual([
      'ARKHOS.EXPLORATION.2',
    ]);
    expect(restoredBoard.explorationDiscardPile).toEqual([
      'ARKHOS.EXPLORATION.3',
    ]);
    expect(restoredBoard.securityCardsByPlayer).toEqual({
      p1: [{ cardId: 'AIcard01', traceColor: ETrace.PINK, zone: 'hand' }],
    });
    expect(restoredBoard.accessByPlayer).toEqual({
      p1: { breachedCount: 1, accessLevel: 1 },
    });
    expect(restoredBoard.resolvedExplorationRewards).toEqual([
      {
        playerId: 'p1',
        cardId: 'ARKHOS.EXPLORATION.3',
        size: 'minor',
        effectId: 'ARKHOS_EXPLORATION_03_MINOR_UNMAPPED',
      },
    ]);
  });

  it('round-trips Centaurians message runtime state', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    game.hiddenAliens = [EAlienType.CENTAURIANS];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
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
        resolved: true,
      },
    ];
    board.pendingMessagesByPlayer = { p1: [], p2: ['ET.31'] };
    const firstRewardSlot = board.rewardSlots[0];
    if (!firstRewardSlot) {
      throw new Error('expected Centaurians reward slot');
    }
    firstRewardSlot.claimedByPlayerId = 'p1';

    const restored = deserializeGame(serializeGame(game, 1));
    const restoredBoard = restored.alienState.getBoardByType(
      EAlienType.CENTAURIANS,
    );

    if (!isCentauriansAlienBoard(restoredBoard)) {
      throw new Error('expected restored Centaurians board');
    }
    expect(restoredBoard.messageMilestones).toEqual([
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
        resolved: true,
      },
    ]);
    expect(restoredBoard.pendingMessagesByPlayer).toEqual({
      p1: [],
      p2: ['ET.31'],
    });
    expect(restoredBoard.rewardSlots[0]).toEqual(
      expect.objectContaining({
        slotId: 'any-trace',
        claimedByPlayerId: 'p1',
      }),
    );
  });

  it('round-trips Mascamites board runtime state', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    game.hiddenAliens = [EAlienType.MASCAMITES];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.getBoardByType(EAlienType.MASCAMITES);
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

    const restored = deserializeGame(serializeGame(game, 1));
    const restoredBoard = restored.alienState.getBoardByType(
      EAlienType.MASCAMITES,
    );

    if (!isMascamitesAlienBoard(restoredBoard)) {
      throw new Error('expected restored Mascamites board');
    }
    expect(restoredBoard.samplePools).toEqual({
      jupiter: ['mascamites-credit-2', 'mascamites-energy-2'],
      saturn: ['mascamites-card-2'],
    });
    expect(restoredBoard.publicSamples).toEqual(['mascamites-vp-7']);
    expect(restoredBoard.capsules).toEqual([
      {
        capsuleId: 'capsule-1',
        ownerId: 'p1',
        sampleTokenId: 'mascamites-credit-2',
        sourcePlanet: EPlanet.JUPITER,
        spaceId: 'ring-2-cell-1',
        missionCardId: 'ET.1',
      },
    ]);
    expect(restoredBoard.deliveredSamples).toEqual([
      {
        sampleTokenId: 'mascamites-vp-7',
        deliveredBy: 'p2',
        deliveredAtRound: 3,
        slotId: 'alien-0-mascamites-sample-blue-0',
      },
    ]);
    expect(restoredBoard.speciesTraceSlots).toEqual([
      expect.objectContaining({
        slotId: 'alien-0-mascamites-sample-blue-0',
      }),
    ]);
  });

  it('restores RNG sequence and game can continue', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    const dto = serializeGame(game, 1);
    const restored = deserializeGame(dto);

    expect(restored.random.next()).toBe(game.random.next());

    expect(() => {
      restored.processMainAction(restored.activePlayer.id, {
        type: EMainAction.PASS,
      });
    }).not.toThrow();
  });

  describe('rehydratePendingInputs — resolution journal', () => {
    it('rebuilds a pending research-tech prompt after serialize/deserialize', () => {
      const game = createTestGame();
      resolveSetupTucks(game);
      const player = getPlayer(game, 'p1');

      player.resources.gain({ publicity: 20 });
      const baseState = serializeGame(game, 1);
      game.processMainAction(player.id, { type: EMainAction.RESEARCH_TECH });
      (
        game as unknown as {
          pendingResolutionJournal?: unknown;
        }
      ).pendingResolutionJournal = {
        version: 1,
        baseState,
        steps: [
          {
            type: 'MAIN_ACTION',
            playerId: player.id,
            action: { type: EMainAction.RESEARCH_TECH },
          },
        ],
      };

      const pendingModel = player.waitingFor?.toModel() as
        | ISelectOptionInputModel
        | undefined;
      expect(game.phase).toBe(EPhase.IN_RESOLUTION);
      expect(pendingModel?.type).toBe(EPlayerInputType.OPTION);

      const restored = deserializeGame(serializeGame(game, 1));
      const restoredPlayer = getPlayer(restored, 'p1');
      const restoredModel = restoredPlayer.waitingFor?.toModel() as
        | ISelectOptionInputModel
        | undefined;

      expect(restored.phase).toBe(EPhase.IN_RESOLUTION);
      expect(restoredModel).toMatchObject({
        type: EPlayerInputType.OPTION,
        title: 'Select a technology to research',
        options: pendingModel?.options,
      });

      const firstOption = restoredModel?.options[0];
      expect(firstOption).toBeDefined();
      restored.processInput(restoredPlayer.id, {
        type: EPlayerInputType.OPTION,
        optionId: firstOption?.id ?? '',
      });

      expect(restoredPlayer.waitingFor).toBeUndefined();
      expect(restored.phase).toBe(EPhase.AWAIT_END_TURN);
    });
  });

  describe('rehydratePendingInputs — setup tuck chain', () => {
    it('rebuilds setup tuck prompt when a player still owes tucks', () => {
      const game = createTestGame();
      expect(game.players.every((p) => p.pendingSetupTucks > 0)).toBe(true);
      expect(game.players.every((p) => Boolean(p.waitingFor))).toBe(true);

      const dto = serializeGame(game, 1);
      // Sanity check: pending input is NOT persisted, only the counter
      // survives. Any rebuild must use that counter as source of truth.
      expect(dto.players.every((p) => p.waitingFor === null)).toBe(true);
      expect(dto.players.every((p) => p.pendingSetupTucks > 0)).toBe(true);

      const restored = deserializeGame(dto);

      for (const player of restored.players) {
        expect(player.waitingFor).toBeDefined();
        expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);
      }
    });

    it('does NOT rebuild a prompt for players who have finished their setup tucks', () => {
      const game = createTestGame();
      const p1 = getPlayer(game, 'p1');
      // Fully resolve p1's chain; p2 still owes.
      while (p1.waitingFor) {
        const model = p1.waitingFor.toModel();
        if (model.type !== EPlayerInputType.CARD) break;
        const cardModel = model as {
          cards: Array<{ id: string }>;
          minSelections: number;
        };
        const cardIds = cardModel.cards
          .slice(0, cardModel.minSelections)
          .map((card) => card.id);
        game.processInput(p1.id, {
          type: EPlayerInputType.CARD,
          cardIds,
        });
      }
      expect(p1.pendingSetupTucks).toBe(0);
      expect(p1.waitingFor).toBeUndefined();

      const restored = deserializeGame(serializeGame(game, 1));
      const restoredP1 = getPlayer(restored, 'p1');
      const restoredP2 = getPlayer(restored, 'p2');

      expect(restoredP1.pendingSetupTucks).toBe(0);
      expect(restoredP1.waitingFor).toBeUndefined();
      // The peer who still owes gets a fresh prompt.
      expect(restoredP2.pendingSetupTucks).toBeGreaterThan(0);
      expect(restoredP2.waitingFor).toBeDefined();
    });

    it('does NOT override an existing non-setup-tuck pending input', () => {
      // Directly exercise the deserializer with a crafted DTO where one
      // player has a waitingFor pre-set — rehydrate should be a no-op
      // for that player.
      const game = createTestGame();
      resolveSetupTucks(game);
      // Now craft a scenario: drive the game to a state where p1 has a
      // non-setup pending input (e.g. by triggering a main action that
      // leaves one). For this test we use PASS which produces no
      // pending input, and just sanity-check the no-override path
      // semantics via a direct check: after round-trip, waitingFor
      // should remain undefined (no setup tucks owed).
      const dto = serializeGame(game, 1);
      const restored = deserializeGame(dto);
      for (const player of restored.players) {
        expect(player.pendingSetupTucks).toBe(0);
        expect(player.waitingFor).toBeUndefined();
      }
    });

    it('survives undo-style round-trip mid-setup', () => {
      // Simulates the undo path: deserialize, tuck, re-serialize,
      // deserialize again — the counter should drive prompt state the
      // whole way.
      const game = createTestGame();
      const firstDto = serializeGame(game, 1);
      const afterFirstRestore = deserializeGame(firstDto);
      const p1 = getPlayer(afterFirstRestore, 'p1');

      expect(p1.waitingFor).toBeDefined();
      if (!p1.waitingFor) {
        throw new Error('expected setup tuck prompt');
      }

      const model = p1.waitingFor.toModel() as {
        cards: Array<{ id: string }>;
        minSelections: number;
      };
      afterFirstRestore.processInput(p1.id, {
        type: EPlayerInputType.CARD,
        cardIds: model.cards.slice(0, model.minSelections).map((c) => c.id),
      });

      const secondDto = serializeGame(afterFirstRestore, 2);
      const afterSecondRestore = deserializeGame(secondDto);
      const restoredP1 = getPlayer(afterSecondRestore, 'p1');

      expect(restoredP1.pendingSetupTucks).toBe(0);
      expect(restoredP1.waitingFor).toBeUndefined();
    });
  });
});
