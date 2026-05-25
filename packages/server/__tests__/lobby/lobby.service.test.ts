import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EAlienType } from '@seti/common/types/BaseCard';
import { DEFAULT_ALIEN_MODULES_ENABLED } from '@seti/common/types/protocol/options';
import { vi } from 'vitest';
import { LobbyService } from '@/lobby/lobby.service.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';

const MOCK_GAME = {
  id: 'game-1',
  name: 'Test Room',
  hostUserId: 'host-user',
  status: 'waiting',
  playerCount: 2,
  currentRound: 0,
  seed: 'seed-1',
  options: {
    playerCount: 2,
    alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
    undoAllowed: true,
    timerPerTurn: 0,
    expansions: [],
    isSoloMode: false,
    soloDifficulty: 1,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_SOLO_GAME = {
  ...MOCK_GAME,
  options: {
    ...MOCK_GAME.options,
    isSoloMode: true,
    soloDifficulty: 3,
  },
};

const MOCK_PLAYER = {
  userId: 'host-user',
  seatIndex: 0,
  color: 'red',
  name: 'Alice',
};
const MISSING_USER_ID = 'bf91fbcb-f898-43f6-8aca-0d94e7b908c3';

type TTestLobbyService = {
  getPlayersForGame: () => Promise<(typeof MOCK_PLAYER)[]>;
  gameRepo: { startFromLobby: ReturnType<typeof vi.fn> };
};

function createMockDb() {
  const mockInsertChain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  };
  const mockSelectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    // `limit` is awaitable in the legacy code paths AND returns
    // something `.for('update')` can be chained on inside `startGame`'s
    // transaction. Drizzle's real query builder is awaitable AND
    // chainable on the same object, so a plain `mockReturnThis` is
    // sufficient — vitest only awaits the resolved value.
    limit: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    for: vi.fn().mockResolvedValue([MOCK_GAME]),
    // Tests await `select().limit()` directly — make the chain object
    // thenable so legacy `await db.select()...limit(1)` paths still
    // resolve to `[MOCK_GAME]`.
    then: (resolve: (value: unknown) => unknown) => resolve([MOCK_GAME]),
  };
  const mockUpdateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  const mockDeleteChain = {
    where: vi.fn().mockResolvedValue(undefined),
  };

  const db = {
    select: vi.fn().mockReturnValue(mockSelectChain),
    insert: vi.fn().mockReturnValue(mockInsertChain),
    update: vi.fn().mockReturnValue(mockUpdateChain),
    delete: vi.fn().mockReturnValue(mockDeleteChain),
    // The new `startGame` wraps its work in `db.transaction(async tx
    // => …)`; the mock just runs the callback inline against the same
    // mock db so existing chain-stub fixtures are reused.
    transaction: vi.fn(),
    _selectChain: mockSelectChain,
    _insertChain: mockInsertChain,
    _updateChain: mockUpdateChain,
  };
  db.transaction.mockImplementation(
    async (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
  );
  return db;
}

function mockMissingUserWithRoomQueries(db: ReturnType<typeof createMockDb>) {
  db.select.mockImplementation((selection?: Record<string, unknown>) => {
    const selectionKeys = selection ? Object.keys(selection) : [];
    if (selectionKeys.length === 1 && selectionKeys[0] === 'id') {
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
    }

    if (!selection) {
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([MOCK_GAME]),
          }),
        }),
      };
    }

    return {
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([MOCK_PLAYER]),
        }),
      }),
    };
  });
}

describe('LobbyService', () => {
  let service: LobbyService;
  let db: ReturnType<typeof createMockDb>;

  beforeEach(async () => {
    vi.clearAllMocks();
    db = createMockDb();

    const module = await Test.createTestingModule({
      providers: [LobbyService, { provide: DRIZZLE_DB, useValue: db }],
    }).compile();

    service = module.get(LobbyService);
  });

  describe('createRoom', () => {
    it('rejects creating a room for an authenticated user that no longer exists', async () => {
      mockMissingUserWithRoomQueries(db);

      await expect(
        service.createRoom(MISSING_USER_ID, 'My Room', 2),
      ).rejects.toThrow(UnauthorizedException);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('creates a room and auto-joins the host', async () => {
      db._selectChain.limit.mockResolvedValueOnce([
        {
          ...MOCK_GAME,
          id: expect.any(String),
        },
      ]);
      db._selectChain.innerJoin.mockReturnValue(db._selectChain);
      db._selectChain.from.mockReturnValue(db._selectChain);
      db._selectChain.where.mockReturnValue(db._selectChain);
      db._selectChain.limit.mockResolvedValueOnce([
        {
          ...MOCK_GAME,
          id: 'new-game',
        },
      ]);
      db._selectChain.orderBy.mockReturnValue(db._selectChain);

      const selectCallIndex = { count: 0 };
      db.select.mockImplementation(() => {
        selectCallIndex.count += 1;
        if (selectCallIndex.count <= 3) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([MOCK_GAME]),
                orderBy: vi.fn().mockReturnThis(),
              }),
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([MOCK_PLAYER]),
              }),
            }),
          };
        }
        return db._selectChain;
      });

      const result = await service.createRoom('host-user', 'My Room', 2);

      expect(db.insert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('listRooms', () => {
    it('returns rooms ordered by creation date', async () => {
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([MOCK_GAME]),
          }),
        }),
      });

      db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([MOCK_GAME]),
            limit: vi.fn().mockResolvedValue([MOCK_GAME]),
          }),
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([MOCK_PLAYER]),
          }),
        }),
      }));

      const rooms = await service.listRooms('waiting');

      expect(rooms).toHaveLength(1);
      expect(rooms[0].name).toBe('Test Room');
    });
  });

  describe('joinRoom', () => {
    it('rejects joining a room for an authenticated user that no longer exists', async () => {
      mockMissingUserWithRoomQueries(db);

      await expect(service.joinRoom('game-1', MISSING_USER_ID)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('rejects joining non-waiting room', async () => {
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue([{ ...MOCK_GAME, status: 'playing' }]),
          }),
        }),
      });

      await expect(service.joinRoom('game-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects duplicate join', async () => {
      const selectImpl = () => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([MOCK_GAME]),
          }),
          innerJoin: vi.fn().mockReturnValue({
            where: vi
              .fn()
              .mockResolvedValue([{ ...MOCK_PLAYER, userId: 'user-2' }]),
          }),
        }),
      });
      db.select.mockImplementation(selectImpl);

      await expect(service.joinRoom('game-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects additional human joins for a solo room', async () => {
      db._selectChain.limit.mockResolvedValue([MOCK_SOLO_GAME]);
      vi.spyOn(
        service as unknown as TTestLobbyService,
        'getPlayersForGame',
      ).mockResolvedValue([MOCK_PLAYER]);

      await expect(service.joinRoom('game-1', 'user-2')).rejects.toThrow(
        'Room is full',
      );
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('updateRoomOptions', () => {
    it('updates waiting-room options for the host and merges alien module patches', async () => {
      db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([MOCK_GAME]),
          }),
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([MOCK_PLAYER]),
          }),
        }),
      }));

      await service.updateRoomOptions('game-1', 'host-user', {
        alienModulesEnabled: {
          [EAlienType.ANOMALIES]: false,
        },
      });

      expect(db.update).toHaveBeenCalled();
      expect(db._updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            alienModulesEnabled: expect.objectContaining({
              [EAlienType.ANOMALIES]: false,
              [EAlienType.CENTAURIANS]: true,
            }),
          }),
        }),
      );
    });

    it('rejects non-host option updates', async () => {
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([MOCK_GAME]),
          }),
        }),
      });

      await expect(
        service.updateRoomOptions('game-1', 'not-host', {
          timerPerTurn: 120,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects shrinking the room below the current player count', async () => {
      db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([MOCK_GAME]),
          }),
          innerJoin: vi.fn().mockReturnValue({
            where: vi
              .fn()
              .mockResolvedValue([
                MOCK_PLAYER,
                { ...MOCK_PLAYER, userId: 'user-2', seatIndex: 1 },
                { ...MOCK_PLAYER, userId: 'user-3', seatIndex: 2 },
              ]),
          }),
        }),
      }));

      await expect(
        service.updateRoomOptions('game-1', 'host-user', {
          playerCount: 2,
        }),
      ).rejects.toThrow(
        'Cannot reduce player count below the current number of players',
      );
      expect(db.update).not.toHaveBeenCalled();
    });
  });

  describe('startGame', () => {
    it('rejects non-host starting', async () => {
      // The new `startGame` uses `tx.select()...limit(1).for('update')`
      // for the row lock; mock `.for()` as the awaitable terminator.
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              for: vi.fn().mockResolvedValue([MOCK_GAME]),
            }),
          }),
        }),
      });

      await expect(service.startGame('game-1', 'not-host')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects starting with fewer than 2 players', async () => {
      const selectImpl = () => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              for: vi.fn().mockResolvedValue([MOCK_GAME]),
            }),
          }),
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      db.select.mockImplementation(selectImpl);

      await expect(service.startGame('game-1', 'host-user')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('starts a solo room with only the host and a synthetic rival', async () => {
      // startGame's row-lock select resolves through `.for('update')`,
      // which the mock chain handles via `_selectChain.for`. We only
      // override `.for` so the test feeds the solo fixture into the
      // transactional path.
      db._selectChain.for.mockResolvedValue([MOCK_SOLO_GAME]);
      vi.spyOn(
        service as unknown as TTestLobbyService,
        'getPlayersForGame',
      ).mockResolvedValue([MOCK_PLAYER]);
      // The transaction-wrapped startGame builds a fresh `GameRepository`
      // around the tx; capture `startFromLobby` calls by stubbing
      // GameRepository's prototype.
      const startFromLobby = vi.fn().mockResolvedValue(undefined);
      const gameRepo = (service as unknown as TTestLobbyService).gameRepo;
      gameRepo.startFromLobby = startFromLobby;
      const { GameRepository: TestGameRepository } = await import(
        '@/persistence/repository/GameRepository.js'
      );
      const protoSpy = vi
        .spyOn(TestGameRepository.prototype, 'startFromLobby')
        .mockImplementation(startFromLobby);

      await expect(
        service.startGame('game-1', 'host-user'),
      ).resolves.toBeDefined();

      // The transaction-wrapped path constructs a fresh GameRepository
      // bound to the tx, so the call lands on the prototype spy rather
      // than the field-replaced stub on the original gameRepo.
      const startedGame = startFromLobby.mock.calls[0]?.[0];
      expect(startedGame).toBeDefined();
      expect(startedGame.players).toHaveLength(2);
      expect(startedGame.players[1].id).toBe('rival:game-1');
      expect(startedGame.options).toMatchObject({
        isSoloMode: true,
        soloDifficulty: 3,
        playerCount: 2,
      });
      protoSpy.mockRestore();
    });

    // Regression for the double-start race: two concurrent
    // POST /lobby/rooms/:id/start (double-click, retry from a stale
    // tab) used to both pass the `status === 'waiting'` guard and
    // create two diverging Game instances for the same gameId. With
    // the row-locking transaction, the second call sees status
    // already flipped to 'playing' and rejects.
    it('rejects a second concurrent start once the first one settles', async () => {
      // Simulate the lock + atomic flip: the FIRST `.for('update')`
      // returns the waiting room; the SECOND returns it with status
      // already advanced to 'playing' (because the first transaction
      // committed first).
      db._selectChain.for
        .mockResolvedValueOnce([MOCK_SOLO_GAME])
        .mockResolvedValueOnce([
          { ...MOCK_SOLO_GAME, status: 'playing' as const },
        ]);

      vi.spyOn(
        service as unknown as TTestLobbyService,
        'getPlayersForGame',
      ).mockResolvedValue([MOCK_PLAYER]);

      const startFromLobby = vi.fn().mockResolvedValue(undefined);
      const { GameRepository: TestGameRepository } = await import(
        '@/persistence/repository/GameRepository.js'
      );
      const protoSpy = vi
        .spyOn(TestGameRepository.prototype, 'startFromLobby')
        .mockImplementation(startFromLobby);

      await expect(
        service.startGame('game-1', 'host-user'),
      ).resolves.toBeDefined();
      await expect(service.startGame('game-1', 'host-user')).rejects.toThrow(
        BadRequestException,
      );

      // Only the first start should have actually persisted a game.
      expect(startFromLobby).toHaveBeenCalledTimes(1);
      protoSpy.mockRestore();
    });
  });

  describe('leaveRoom', () => {
    it('throws for non-existing room', async () => {
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.leaveRoom('nonexistent', 'user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects leaving started room', async () => {
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue([{ ...MOCK_GAME, status: 'playing' }]),
          }),
        }),
      });

      await expect(service.leaveRoom('game-1', 'host-user')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
