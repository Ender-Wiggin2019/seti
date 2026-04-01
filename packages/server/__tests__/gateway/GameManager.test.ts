import { Test } from '@nestjs/testing';
import { EMainAction, EPhase } from '@seti/common/types/protocol/enums';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { GameManager } from '@/gateway/GameManager.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';

function createTestGame(): IGame {
  return Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'manager-test-seed',
    'game-mgr-test',
  );
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
  });
});
