import { EResource } from '@seti/common/types/element';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useServerDebugSession } from '@/hooks/useServerDebugSession';
import { EAlienType, EPlayerInputType } from '@/types/re-exports';

function card(id: string, name = id) {
  return {
    id,
    name,
    price: 0,
    income: EResource.CREDIT,
    effects: [],
  };
}

const debugApiMock = vi.hoisted(() => ({
  createServerSession: vi.fn(),
  getState: vi.fn(),
  getPendingInput: vi.fn(),
  solarRotateNext: vi.fn(),
  revealAlien: vi.fn(),
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
      cardRow: [card('debug-card', 'Debug Card')],
      endOfRoundStacks: [[card('debug-eor-card', 'Debug EOR Card')]],
      players: [
        {
          playerId: 'p1',
          hand: [card('debug-hand-card', 'Debug Hand Card')],
        },
      ],
    });
    debugApiMock.getPendingInput.mockResolvedValue({
      inputId: 'input-card',
      type: EPlayerInputType.CARD,
      cards: [card('debug-prompt-card', 'Debug Prompt Card')],
      min: 1,
      max: 1,
    });
    debugApiMock.solarRotateNext.mockResolvedValue({
      gameId: 'game-1',
      cardRow: [],
      endOfRoundStacks: [],
      players: [],
    });
    debugApiMock.revealAlien.mockResolvedValue({
      gameId: 'game-1',
      cardRow: [],
      endOfRoundStacks: [],
      players: [],
    });
  });

  it('uses card objects from the debug REST state and pending input', async () => {
    const { result } = renderHook(() => useServerDebugSession(true));

    await waitFor(() => expect(result.current?.gameState).not.toBeNull());

    expect(result.current?.gameState?.cardRow[0]).toMatchObject({
      id: 'debug-card',
      name: 'Debug Card',
    });
    expect(result.current?.gameState?.players[0].hand?.[0]).toMatchObject({
      id: 'debug-hand-card',
      name: 'Debug Hand Card',
    });
    expect(result.current?.pendingInput).toMatchObject({
      inputId: 'input-card',
      cards: [
        {
          id: 'debug-prompt-card',
          name: 'Debug Prompt Card',
        },
      ],
    });
  });

  it('rotates the server-selected next solar disc', async () => {
    const { result } = renderHook(() => useServerDebugSession(true));

    await waitFor(() => expect(result.current?.gameState).not.toBeNull());

    await act(async () => {
      await result.current?.solarRotateNext();
    });

    expect(debugApiMock.solarRotateNext).toHaveBeenCalledWith('game-1', 'p1');
  });

  it('reveals an alien through the debug REST endpoint', async () => {
    const { result } = renderHook(() => useServerDebugSession(true));

    await waitFor(() => expect(result.current?.gameState).not.toBeNull());

    await act(async () => {
      await result.current?.revealAlien(EAlienType.GLYPHIDS);
    });

    expect(debugApiMock.revealAlien).toHaveBeenCalledWith(
      'game-1',
      EAlienType.GLYPHIDS,
      'p1',
    );
  });
});
