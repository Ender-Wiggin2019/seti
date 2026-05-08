import { describe, expect, it, vi } from 'vitest';

const httpClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
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
          alienModulesEnabled: [true, true, false, false, false],
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
      }),
    );
  });
});
