import { Test } from '@nestjs/testing';
import { EMainAction, EPhase } from '@seti/common/types/protocol/enums';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { GameManager } from '@/gateway/GameManager.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import { resolveSetupTucks } from '../helpers/TestGameBuilder.js';

function createTestGame(): IGame {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'manager-test-seed',
    'game-mgr-test',
  );
  resolveSetupTucks(game);
  return game;
}

function createSoloTestGame(): Game {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      {
        id: 'rival:game-mgr-solo',
        name: 'Rival Institution',
        color: 'blue',
        seatIndex: 1,
      },
    ],
    {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty: 3,
    } as Parameters<typeof Game.create>[1],
    'manager-solo-seed',
    'game-mgr-solo',
  );
  resolveSetupTucks(game);
  return game;
}

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

function setupMockDbForSnapshot() {
  const insertChain = {
    values: vi.fn().mockResolvedValue(undefined),
  };
  mockDb.insert.mockReturnValue(insertChain);

  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  mockDb.select.mockReturnValue(selectChain);
}

describe('GameManager', () => {
  let manager: GameManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    setupMockDbForSnapshot();

    const module = await Test.createTestingModule({
      providers: [GameManager, { provide: DRIZZLE_DB, useValue: mockDb }],
    }).compile();

    manager = module.get(GameManager);
  });

  describe('getGame', () => {
    it('returns cached game on second call', async () => {
      const game = createTestGame();
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );

      const result = await manager.getGame('game-mgr-test');
      expect(result.id).toBe('game-mgr-test');
      expect(result).toBe(game);
    });

    it('throws when game not in cache or DB', async () => {
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(selectChain);

      await expect(manager.getGame('nonexistent')).rejects.toThrow(
        'Game nonexistent not found',
      );
    });
  });

  describe('processAction', () => {
    it('executes a main action and returns per-player states', async () => {
      const game = createTestGame();
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-test',
        0,
      );

      const result = await manager.processAction('game-mgr-test', 'p1', {
        type: EMainAction.PASS,
      });

      expect(result.states.size).toBe(2);
      expect(result.states.has('p1')).toBe(true);
      expect(result.states.has('p2')).toBe(true);

      const p1State = result.states.get('p1');
      expect(p1State).toBeDefined();
    });

    it('saves a snapshot after action', async () => {
      const game = createTestGame();
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-test',
        0,
      );

      await manager.processAction('game-mgr-test', 'p1', {
        type: EMainAction.PASS,
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('automatically resolves rival turns before returning projected states', async () => {
      const game = createSoloTestGame();
      const rivalState = game.rivalState;
      if (!rivalState) throw new Error('expected rival state');
      rivalState.actionDeck = new Deck(['S.1']);
      game.startPlayer = game.players[0];
      game.activePlayer = game.players[0];
      game.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });
      expect(game.phase).toBe(EPhase.AWAIT_END_TURN);

      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-solo',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-solo',
        0,
      );

      const result = await manager.processEndTurn('game-mgr-solo', 'p1');

      expect(game.activePlayer.id).toBe('p1');
      expect(result.states.get('p1')?.currentPlayerId).toBe('p1');
      expect(rivalState.actionDeck.discardSize).toBe(1);
      expect(game.players[1].probesInSpace).toBe(1);
    });
  });

  describe('processFreeAction', () => {
    it('returns updated state after free action', async () => {
      const game = createTestGame();
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );

      const result = await manager.processFreeAction('game-mgr-test', 'p1', {
        type: 'EXCHANGE_RESOURCES' as never,
        from: 'credit' as never,
        to: 'energy' as never,
      });

      expect(result.states.size).toBe(2);
    });
  });

  describe('getProjectedState', () => {
    it('returns null for unloaded game', () => {
      const state = manager.getProjectedState('nonexistent', 'p1');
      expect(state).toBeNull();
    });

    it('returns per-player projected state', () => {
      const game = createTestGame();
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );

      const state = manager.getProjectedState('game-mgr-test', 'p1');
      expect(state).toBeDefined();
      expect(state?.gameId).toBe('game-mgr-test');
    });
  });

  describe('registerGame', () => {
    it('automatically resolves a ready solo rival start turn before projection', () => {
      const game = createSoloTestGame();
      const rivalState = game.rivalState;
      if (!rivalState) throw new Error('expected rival state');
      rivalState.actionDeck = new Deck(['S.1']);
      game.startPlayer = game.players[1];
      game.activePlayer = game.players[1];
      game.phase = EPhase.AWAIT_MAIN_ACTION;

      manager.registerGame(game);

      expect(game.activePlayer.id).toBe('p1');
      expect(rivalState.actionDeck.discardSize).toBe(1);
      expect(manager.getProjectedState('game-mgr-solo', 'p1')?.currentPlayerId).toBe(
        'p1',
      );
    });
  });

  describe('isGameLoaded', () => {
    it('returns false for unloaded game', () => {
      expect(manager.isGameLoaded('nonexistent')).toBe(false);
    });

    it('returns true for loaded game', () => {
      const game = createTestGame();
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      expect(manager.isGameLoaded('game-mgr-test')).toBe(true);
    });
  });

  describe('unloadGame', () => {
    it('removes game from cache', async () => {
      const game = createTestGame();
      const cache = (manager as unknown as { cache: Map<string, IGame> }).cache;
      cache.set('game-mgr-test', game);

      await manager.unloadGame('game-mgr-test');

      expect(cache.has('game-mgr-test')).toBe(false);
    });

    it('persists unload snapshot using next version', async () => {
      const game = createTestGame();
      const cache = (manager as unknown as { cache: Map<string, IGame> }).cache;
      const versions = (manager as unknown as { versions: Map<string, number> })
        .versions;
      cache.set('game-mgr-test', game);
      versions.set('game-mgr-test', 3);

      const saveSnapshotMock = vi.fn().mockResolvedValue(undefined);
      (
        manager as unknown as {
          gameRepo: { saveSnapshot: typeof saveSnapshotMock };
        }
      ).gameRepo.saveSnapshot = saveSnapshotMock;

      await manager.unloadGame('game-mgr-test');

      expect(saveSnapshotMock).toHaveBeenCalledWith(
        'game-mgr-test',
        4,
        expect.any(Object),
        { type: 'UNLOAD' },
      );
    });
  });
});
