import { Test } from '@nestjs/testing';
import { LobbyController } from '@/lobby/lobby.controller.js';
import { LobbyService } from '@/lobby/lobby.service.js';

const MOCK_ROOM = {
  id: 'room-1',
  name: 'My Room',
  status: 'waiting',
  hostUserId: 'host-1',
  playerCount: 2,
  currentPlayers: [
    { userId: 'host-1', name: 'Alice', seatIndex: 0, color: 'red' },
  ],
  options: { playerCount: 2 },
  createdAt: new Date(),
};

const mockLobbyService = {
  listRooms: vi.fn().mockResolvedValue([MOCK_ROOM]),
  createRoom: vi.fn().mockResolvedValue(MOCK_ROOM),
  getRoomById: vi.fn().mockResolvedValue(MOCK_ROOM),
  joinRoom: vi.fn().mockResolvedValue(MOCK_ROOM),
  leaveRoom: vi.fn().mockResolvedValue(MOCK_ROOM),
  startGame: vi.fn().mockResolvedValue(MOCK_ROOM),
};

describe('LobbyController', () => {
  let controller: LobbyController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [LobbyController],
      providers: [{ provide: LobbyService, useValue: mockLobbyService }],
    }).compile();

    controller = module.get(LobbyController);
  });

  it('GET /lobby/rooms returns room list', async () => {
    const result = await controller.listRooms('waiting');

    expect(mockLobbyService.listRooms).toHaveBeenCalledWith('waiting');
    expect(result).toHaveLength(1);
  });

  it('POST /lobby/rooms creates a room', async () => {
    const req = { user: { sub: 'host-1', email: 'host@t.com' } };
    const result = await controller.createRoom(req, {
      name: 'My Room',
      playerCount: 2,
    });

    expect(mockLobbyService.createRoom).toHaveBeenCalledWith(
      'host-1',
      'My Room',
      2,
      undefined,
      undefined,
      undefined,
    );
    expect(result.id).toBe('room-1');
  });

  it('GET /lobby/rooms/:id returns room details', async () => {
    const result = await controller.getRoom('room-1');

    expect(mockLobbyService.getRoomById).toHaveBeenCalledWith('room-1');
    expect(result.name).toBe('My Room');
  });

  it('POST /lobby/rooms/:id/join joins a room', async () => {
    const req = { user: { sub: 'user-2', email: 'u2@t.com' } };
    const result = await controller.joinRoom(req, 'room-1');

    expect(mockLobbyService.joinRoom).toHaveBeenCalledWith('room-1', 'user-2');
    expect(result).toBeDefined();
  });

  it('POST /lobby/rooms/:id/leave leaves a room', async () => {
    const req = { user: { sub: 'user-2', email: 'u2@t.com' } };
    const result = await controller.leaveRoom(req, 'room-1');

    expect(mockLobbyService.leaveRoom).toHaveBeenCalledWith('room-1', 'user-2');
    expect(result).toBeDefined();
  });

  it('POST /lobby/rooms/:id/start starts the game', async () => {
    const req = { user: { sub: 'host-1', email: 'host@t.com' } };
    const result = await controller.startGame(req, 'room-1');

    expect(mockLobbyService.startGame).toHaveBeenCalledWith('room-1', 'host-1');
    expect(result).toBeDefined();
  });
});
