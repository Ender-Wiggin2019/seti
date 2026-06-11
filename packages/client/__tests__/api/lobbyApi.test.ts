import { EAlienType } from '@seti/common/types/BaseCard';
import { DEFAULT_ALIEN_MODULES_ENABLED } from '@seti/common/types/protocol/options';
import { describe, expect, it, vi } from 'vitest';

const httpClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/api/httpClient', () => ({
  httpClient: httpClientMock,
}));

describe('lobbyApi', () => {
  it('normalizes paged room lists from the server', async () => {
    httpClientMock.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'room-1',
            name: 'Paged Room',
            status: 'waiting',
            hostUserId: 'p1',
            currentPlayers: [
              { userId: 'p1', name: 'Commander', seatIndex: 0, color: 'red' },
            ],
            options: {
              playerCount: 2,
              isSoloMode: false,
              soloDifficulty: 1,
              alienModulesEnabled: {},
              undoAllowed: true,
              timerPerTurn: 0,
            },
            visibleInLobby: true,
            createdAt: '2026-05-08T00:00:00.000Z',
            updatedAt: '2026-05-09T00:00:00.000Z',
          },
        ],
        page: 2,
        pageSize: 1,
        total: 3,
        totalPlayers: 42,
        totalPages: 3,
        hasMore: true,
      },
    });

    const { lobbyApi } = await import('@/api/lobbyApi');
    const page = await lobbyApi.listRooms({ page: 2, pageSize: 1 });

    expect(httpClientMock.get).toHaveBeenCalledWith('/lobby/rooms', {
      params: { page: 2, pageSize: 1 },
    });
    expect(page.items).toHaveLength(1);
    expect(page.totalPlayers).toBe(42);
    expect(page.items[0]).toEqual(
      expect.objectContaining({
        id: 'room-1',
        visibleInLobby: true,
        updatedAt: '2026-05-09T00:00:00.000Z',
      }),
    );
    expect(page.hasMore).toBe(true);
  });

  it('keeps legacy room lists compatible with paged server responses', async () => {
    httpClientMock.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'room-1',
            name: 'Paged Room',
            status: 'waiting',
            hostUserId: 'p1',
            currentPlayers: [
              { userId: 'p1', name: 'Commander', seatIndex: 0, color: 'red' },
            ],
            options: {
              playerCount: 2,
              isSoloMode: false,
              soloDifficulty: 1,
              alienModulesEnabled: {},
              undoAllowed: true,
              timerPerTurn: 0,
            },
            visibleInLobby: true,
            createdAt: '2026-05-08T00:00:00.000Z',
          },
        ],
        page: 1,
        pageSize: 12,
        total: 1,
        totalPlayers: 1,
        totalPages: 1,
        hasMore: false,
      },
    });

    const { lobbyApi } = await import('@/api/lobbyApi');
    const rooms = await lobbyApi.listRoomsLegacy({ page: 1 });

    expect(rooms).toHaveLength(1);
    expect(rooms[0]).toEqual(expect.objectContaining({ id: 'room-1' }));
  });

  it('sends hidden solo visibility when creating a room', async () => {
    httpClientMock.post.mockResolvedValueOnce({
      data: {
        id: 'room-1',
        name: 'Hidden Solo',
        status: 'waiting',
        hostUserId: 'p1',
        currentPlayers: [
          { userId: 'p1', name: 'Commander', seatIndex: 0, color: 'red' },
        ],
        options: {
          playerCount: 2,
          isSoloMode: true,
          soloDifficulty: 2,
          alienModulesEnabled: {},
          undoAllowed: true,
          timerPerTurn: 0,
        },
        visibleInLobby: false,
        createdAt: '2026-05-08T00:00:00.000Z',
      },
    });

    const { lobbyApi } = await import('@/api/lobbyApi');
    await lobbyApi.createRoom({
      name: 'Hidden Solo',
      options: {
        playerCount: 2,
        isSoloMode: true,
        soloDifficulty: 2,
        alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
        undoAllowed: true,
        timerPerTurn: 0,
        expansions: [],
      },
      visibleInLobby: false,
    });

    expect(httpClientMock.post).toHaveBeenCalledWith('/lobby/rooms', {
      name: 'Hidden Solo',
      options: expect.objectContaining({ isSoloMode: true }),
      visibleInLobby: false,
    });
  });

  it('deletes rooms and fetches My Games plus player public profile', async () => {
    httpClientMock.delete.mockResolvedValueOnce({ data: undefined });
    httpClientMock.get
      .mockResolvedValueOnce({
        data: {
          items: [],
          page: 1,
          pageSize: 12,
          total: 0,
          totalPlayers: 0,
          totalPages: 0,
          hasMore: false,
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'p1',
          name: 'Commander',
          joinedAt: '2026-01-01T00:00:00.000Z',
          stats: { gamesPlayed: 2, hostedGames: 1 },
          recentGames: [],
        },
      });

    const { lobbyApi } = await import('@/api/lobbyApi');

    await lobbyApi.deleteRoom('room-1');
    await lobbyApi.listMyGames({ page: 1 });
    const profile = await lobbyApi.getPlayerPublicProfile('p1');

    expect(httpClientMock.delete).toHaveBeenCalledWith('/lobby/rooms/room-1');
    expect(httpClientMock.get).toHaveBeenCalledWith('/lobby/my-games', {
      params: { page: 1 },
    });
    expect(httpClientMock.get).toHaveBeenCalledWith(
      '/lobby/players/p1/profile',
    );
    expect(profile).toEqual(
      expect.objectContaining({
        name: 'Commander',
        stats: { gamesPlayed: 2, hostedGames: 1 },
      }),
    );
  });

  it('preserves solo room options from the server', async () => {
    httpClientMock.get.mockResolvedValueOnce({
      data: {
        id: 'room-1',
        name: 'Solo Trial',
        status: 'waiting',
        hostUserId: 'p1',
        currentPlayers: [
          { userId: 'p1', name: 'Commander', seatIndex: 0, color: 'red' },
        ],
        options: {
          playerCount: 2,
          isSoloMode: true,
          soloDifficulty: 5,
          alienModulesEnabled: {
            [EAlienType.ANOMALIES]: true,
            [EAlienType.CENTAURIANS]: true,
            [EAlienType.EXERTIANS]: false,
            [EAlienType.MASCAMITES]: false,
            [EAlienType.OUMUAMUA]: false,
            [EAlienType.GLYPHIDS]: false,
            [EAlienType.AMOEBA]: false,
            [EAlienType.DUMMY]: false,
          },
          undoAllowed: true,
          timerPerTurn: 0,
        },
        createdAt: '2026-05-08T00:00:00.000Z',
      },
    });

    const { lobbyApi } = await import('@/api/lobbyApi');
    const room = await lobbyApi.getRoom('room-1');

    expect(room.options).toEqual(
      expect.objectContaining({
        playerCount: 2,
        isSoloMode: true,
        soloDifficulty: 5,
        alienModulesEnabled: expect.objectContaining({
          [EAlienType.ANOMALIES]: true,
          [EAlienType.EXERTIANS]: false,
        }),
      }),
    );
  });

  it('patches room options through the lobby endpoint', async () => {
    httpClientMock.patch = vi.fn().mockResolvedValueOnce({
      data: {
        id: 'room-1',
        name: 'Solo Trial',
        status: 'waiting',
        hostUserId: 'p1',
        currentPlayers: [
          { userId: 'p1', name: 'Commander', seatIndex: 0, color: 'red' },
        ],
        options: {
          playerCount: 2,
          isSoloMode: false,
          soloDifficulty: 1,
          alienModulesEnabled: {
            [EAlienType.ANOMALIES]: false,
            [EAlienType.CENTAURIANS]: true,
            [EAlienType.EXERTIANS]: true,
            [EAlienType.MASCAMITES]: true,
            [EAlienType.OUMUAMUA]: true,
            [EAlienType.GLYPHIDS]: false,
            [EAlienType.AMOEBA]: false,
            [EAlienType.DUMMY]: false,
          },
          undoAllowed: true,
          timerPerTurn: 0,
        },
        createdAt: '2026-05-08T00:00:00.000Z',
      },
    });

    const { lobbyApi } = await import('@/api/lobbyApi');
    await lobbyApi.updateRoomOptions('room-1', {
      alienModulesEnabled: {
        [EAlienType.ANOMALIES]: false,
      },
    });

    expect(httpClientMock.patch).toHaveBeenCalledWith(
      '/lobby/rooms/room-1/options',
      {
        alienModulesEnabled: {
          [EAlienType.ANOMALIES]: false,
        },
      },
    );
  });
});
