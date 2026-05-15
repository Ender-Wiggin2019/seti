import { EAlienType } from '@seti/common/types/BaseCard';
import { describe, expect, it, vi } from 'vitest';

const httpClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('@/api/httpClient', () => ({
  httpClient: httpClientMock,
}));

describe('lobbyApi', () => {
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
