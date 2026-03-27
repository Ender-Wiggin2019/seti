import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import { LobbyService } from '@/lobby/lobby.service.js';

const MOCK_GAME = {
  id: 'game-1',
  name: 'Test Room',
  hostUserId: 'host-user',
  status: 'waiting',
  playerCount: 2,
  currentRound: 0,
  seed: 'seed-1',
  options: { playerCount: 2 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_PLAYER = {
  userId: 'host-user',
  seatIndex: 0,
  color: 'red',
  name: 'Alice',
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
    limit: vi.fn().mockResolvedValue([MOCK_GAME]),
    innerJoin: vi.fn().mockReturnThis(),
  };
  const mockUpdateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  const mockDeleteChain = {
    where: vi.fn().mockResolvedValue(undefined),
  };

  return {
    select: vi.fn().mockReturnValue(mockSelectChain),
    insert: vi.fn().mockReturnValue(mockInsertChain),
    update: vi.fn().mockReturnValue(mockUpdateChain),
    delete: vi.fn().mockReturnValue(mockDeleteChain),
    _selectChain: mockSelectChain,
    _insertChain: mockInsertChain,
  };
}

describe('LobbyService', () => {
  let service: LobbyService;
  let db: ReturnType<typeof createMockDb>;

  beforeEach(async () => {
    vi.clearAllMocks();
    db = createMockDb();

    const module = await Test.createTestingModule({
      providers: [
        LobbyService,
        { provide: DRIZZLE_DB, useValue: db },
      ],
    }).compile();

    service = module.get(LobbyService);
  });

  describe('createRoom', () => {
    it('creates a room and auto-joins the host', async () => {
      db._selectChain.limit
        .mockResolvedValueOnce([{
          ...MOCK_GAME,
          id: expect.any(String),
        }]);
      db._selectChain.innerJoin.mockReturnValue(db._selectChain);
      db._selectChain.from.mockReturnValue(db._selectChain);
      db._selectChain.where.mockReturnValue(db._selectChain);
      db._selectChain.limit.mockResolvedValueOnce([{
        ...MOCK_GAME,
        id: 'new-game',
      }]);
      db._selectChain.orderBy.mockReturnValue(db._selectChain);

      const selectCallIndex = { count: 0 };
      db.select.mockImplementation(() => {
        selectCallIndex.count += 1;
        if (selectCallIndex.count <= 2) {
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
    it('rejects joining non-waiting room', async () => {
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { ...MOCK_GAME, status: 'playing' },
            ]),
          }),
        }),
      });

      await expect(
        service.joinRoom('game-1', 'user-2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate join', async () => {
      const selectImpl = () => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([MOCK_GAME]),
          }),
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { ...MOCK_PLAYER, userId: 'user-2' },
            ]),
          }),
        }),
      });
      db.select.mockImplementation(selectImpl);

      await expect(
        service.joinRoom('game-1', 'user-2'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('startGame', () => {
    it('rejects non-host starting', async () => {
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([MOCK_GAME]),
          }),
        }),
      });

      await expect(
        service.startGame('game-1', 'not-host'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects starting with fewer than 2 players', async () => {
      const selectImpl = () => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([MOCK_GAME]),
          }),
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      db.select.mockImplementation(selectImpl);

      await expect(
        service.startGame('game-1', 'host-user'),
      ).rejects.toThrow(BadRequestException);
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

      await expect(
        service.leaveRoom('nonexistent', 'user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects leaving started room', async () => {
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { ...MOCK_GAME, status: 'playing' },
            ]),
          }),
        }),
      });

      await expect(
        service.leaveRoom('game-1', 'host-user'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
