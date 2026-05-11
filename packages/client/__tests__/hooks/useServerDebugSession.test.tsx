import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useServerDebugSession } from '@/hooks/useServerDebugSession';
import { EPlayerInputType } from '@/types/re-exports';

const debugApiMock = vi.hoisted(() => ({
  createServerSession: vi.fn(),
  getState: vi.fn(),
  getPendingInput: vi.fn(),
}));

vi.mock('@/api/debugApi', () => ({
  debugApi: debugApiMock,
}));

describe('useServerDebugSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    debugApiMock.createServerSession.mockResolvedValue({
      gameId: 'game-1',
      accessToken: 'token-1',
      user: {
        id: 'p1',
        name: 'Alice',
        email: 'p1@example.test',
      },
    });
    debugApiMock.getState.mockResolvedValue({
      gameId: 'game-1',
      cardRow: ['debug-card'],
      endOfRoundStacks: [['debug-eor-card']],
      players: [
        {
          playerId: 'p1',
          hand: ['debug-hand-card'],
        },
      ],
    });
    debugApiMock.getPendingInput.mockResolvedValue({
      inputId: 'input-card',
      type: EPlayerInputType.CARD,
      cards: ['debug-prompt-card'],
      min: 1,
      max: 1,
    });
  });

  it('normalizes id-only cards from the debug REST state and pending input', async () => {
    const { result } = renderHook(() => useServerDebugSession(true));

    await waitFor(() => expect(result.current?.gameState).not.toBeNull());

    expect(result.current?.gameState?.cardRow[0]).toMatchObject({
      id: 'debug-card',
      name: 'debug-card',
    });
    expect(result.current?.gameState?.players[0].hand?.[0]).toMatchObject({
      id: 'debug-hand-card',
      name: 'debug-hand-card',
    });
    expect(result.current?.pendingInput).toMatchObject({
      inputId: 'input-card',
      cards: [
        {
          id: 'debug-prompt-card',
          name: 'debug-prompt-card',
        },
      ],
    });
  });
});
