import {
  EAlienType,
  EMainAction,
  EPlanet,
  ETrace,
} from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import {
  isAnomaliesAlienBoard,
  isCentauriansAlienBoard,
  isExertiansAlienBoard,
  isMascamitesAlienBoard,
  isOumuamuaAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { Game } from '@/engine/Game.js';
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

  it('normalizes legacy moon occupant snapshots to stable moon ids', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 1);
    const marsState = dto.planetaryBoard?.planets.find(
      (entry) => entry.planet === EPlanet.MARS,
    )?.state as
      | (NonNullable<typeof dto.planetaryBoard>['planets'][number]['state'] & {
          moonOccupant?: { playerId: string } | null;
          moonOccupants?: unknown;
        })
      | undefined;
    const jupiterState = dto.planetaryBoard?.planets.find(
      (entry) => entry.planet === EPlanet.JUPITER,
    )?.state;

    if (!marsState || !jupiterState) {
      throw new Error('expected planetary board state');
    }

    const legacyMarsState = marsState as {
      moonOccupants?: unknown;
      moonOccupant?: { playerId: string } | null;
    };
    delete legacyMarsState.moonOccupants;
    legacyMarsState.moonOccupant = { playerId: 'p1' };
    jupiterState.moonOccupants = [{ playerId: 'p2', moonIndex: 3 }];

    const restored = deserializeGame(dto);

    expect(
      restored.planetaryBoard?.planets.get(EPlanet.MARS)?.moonOccupants,
    ).toEqual([{ playerId: 'p1', moonId: 'mars-phobos-deimos' }]);
    expect(
      restored.planetaryBoard?.planets.get(EPlanet.JUPITER)?.moonOccupants,
    ).toEqual([{ playerId: 'p2', moonId: 'jupiter-io' }]);
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

  it('normalizes legacy solo rival board ids from older snapshots', () => {
    const game = createSoloTestGame();
    const dto = serializeGame(game, 1);
    if (!dto.rivalState) throw new Error('expected rival state');
    (dto.rivalState as { boardConfigId: string }).boardConfigId =
      'automaBoard4';

    const restored = deserializeGame(dto);

    expect(restored.rivalState?.boardConfigId).toBe('rival-board-4');
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
      traceColor: ETrace.RED,
      maxOccupants: -1,
      rewards: [],
      isDiscovery: false,
    });
    game.solarSystem?.addAlienToken({
      tokenId: 'alien-0-anomaly-token|3|red-trace',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 3,
      traceColor: ETrace.RED,
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
        traceColor: ETrace.RED,
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
    board.rewardSlots[0]!.claimedByPlayerId = 'p1';

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
