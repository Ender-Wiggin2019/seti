import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
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
  listRooms: vi.fn().mockResolvedValue({
    items: [MOCK_ROOM],
    page: 1,
    pageSize: 12,
    total: 1,
    totalPlayers: 1,
    totalPages: 1,
    hasMore: false,
  }),
  listMyGames: vi.fn().mockResolvedValue({
    items: [MOCK_ROOM],
    page: 1,
    pageSize: 6,
    total: 1,
    totalPlayers: 1,
    totalPages: 1,
    hasMore: false,
  }),
  createRoom: vi.fn().mockResolvedValue(MOCK_ROOM),
  getRoomById: vi.fn().mockResolvedValue(MOCK_ROOM),
  getPlayerPublicProfile: vi.fn().mockResolvedValue({
    id: 'host-1',
    name: 'Alice',
    joinedAt: new Date(),
    recentGames: [],
    stats: { gamesPlayed: 1, hostedGames: 1 },
  }),
  joinRoom: vi.fn().mockResolvedValue(MOCK_ROOM),
  leaveRoom: vi.fn().mockResolvedValue(MOCK_ROOM),
  deleteRoom: vi.fn().mockResolvedValue(undefined),
  startGame: vi.fn().mockResolvedValue(MOCK_ROOM),
  updateRoomOptions: vi.fn().mockResolvedValue(MOCK_ROOM),
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

  it('GET /lobby/rooms returns paged room list', async () => {
    const result = await controller.listRooms({
      status: 'waiting',
      page: 2,
      pageSize: 12,
    });

    expect(mockLobbyService.listRooms).toHaveBeenCalledWith({
      status: 'waiting',
      page: 2,
      pageSize: 12,
    });
    expect(result.items).toHaveLength(1);
  });

  it('GET /lobby/my-games returns the authenticated user games', async () => {
    const req = { user: { sub: 'host-1', email: 'host@t.com' } };
    const result = await controller.listMyGames(req, {
      page: 1,
      pageSize: 6,
    });

    expect(mockLobbyService.listMyGames).toHaveBeenCalledWith('host-1', {
      page: 1,
      pageSize: 6,
    });
    expect(result.items).toHaveLength(1);
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
      true,
    );
    expect(result.id).toBe('room-1');
  });

  it('POST /lobby/rooms forwards hidden solo lobby visibility', async () => {
    const req = { user: { sub: 'host-1', email: 'host@t.com' } };

    await controller.createRoom(req, {
      name: 'Hidden Solo',
      playerCount: 2,
      visibleInLobby: false,
      options: {
        playerCount: 2,
        isSoloMode: true,
      },
    });

    expect(mockLobbyService.createRoom).toHaveBeenCalledWith(
      'host-1',
      'Hidden Solo',
      2,
      undefined,
      expect.objectContaining({ isSoloMode: true }),
      false,
    );
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

  it('DELETE /lobby/rooms/:id deletes a waiting room for the host', async () => {
    const req = { user: { sub: 'host-1', email: 'host@t.com' } };

    await controller.deleteRoom(req, 'room-1');

    expect(mockLobbyService.deleteRoom).toHaveBeenCalledWith(
      'room-1',
      'host-1',
    );
  });

  it('GET /lobby/players/:id/profile returns public player profile', async () => {
    const result = await controller.getPlayerPublicProfile('host-1');

    expect(mockLobbyService.getPlayerPublicProfile).toHaveBeenCalledWith(
      'host-1',
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'host-1',
        name: 'Alice',
      }),
    );
  });

  it('POST /lobby/rooms/:id/start starts the game', async () => {
    const req = { user: { sub: 'host-1', email: 'host@t.com' } };
    const result = await controller.startGame(req, 'room-1');

    expect(mockLobbyService.startGame).toHaveBeenCalledWith('room-1', 'host-1');
    expect(result).toBeDefined();
  });

  it('PATCH /lobby/rooms/:id/options updates room options', async () => {
    const req = { user: { sub: 'host-1', email: 'host@t.com' } };
    const patch = {
      alienModulesEnabled: {
        1: false,
        2: true,
      },
    };

    const result = await controller.updateRoomOptions(req, 'room-1', patch);

    expect(mockLobbyService.updateRoomOptions).toHaveBeenCalledWith(
      'room-1',
      'host-1',
      patch,
    );
    expect(result).toBeDefined();
  });
});
