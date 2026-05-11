import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayerInput } from '@/hooks/usePlayerInput';
import type { IPublicGameState } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

const wsMock = vi.hoisted(() => ({
  sendInput: vi.fn(),
  stateHandlers: new Set<(state: IPublicGameState) => void>(),
  waitingHandlers: new Set<(data: never) => void>(),
}));

vi.mock('@/api/wsClient', () => ({
  wsClient: {
    sendInput: wsMock.sendInput,
    onState: vi.fn((handler: (state: IPublicGameState) => void) => {
      wsMock.stateHandlers.add(handler);
      return () => wsMock.stateHandlers.delete(handler);
    }),
    onWaiting: vi.fn((handler: (data: never) => void) => {
      wsMock.waitingHandlers.add(handler);
      return () => wsMock.waitingHandlers.delete(handler);
    }),
  },
}));

function emitWaiting(data: {
  playerId: string;
  input: {
    inputId: string;
    type: EPlayerInputType;
    options: Array<{ id: string; label: string }>;
  };
}): void {
  for (const handler of wsMock.waitingHandlers) {
    handler(data as never);
  }
}

function emitState(state: IPublicGameState): void {
  for (const handler of wsMock.stateHandlers) {
    handler(state);
  }
}

describe('usePlayerInput', () => {
  beforeEach(() => {
    wsMock.sendInput.mockClear();
    wsMock.stateHandlers.clear();
    wsMock.waitingHandlers.clear();
  });

  it('keeps the pending prompt after sending and clears it on authoritative state', () => {
    const { result } = renderHook(() => usePlayerInput());

    act(() => {
      emitWaiting({
        playerId: 'p1',
        input: {
          inputId: 'input-1',
          type: EPlayerInputType.OPTION,
          options: [{ id: 'confirm', label: 'Confirm' }],
        },
      });
    });

    act(() => {
      result.current.respond('game-1', {
        type: EPlayerInputType.OPTION,
        optionId: 'confirm',
      });
    });

    expect(wsMock.sendInput).toHaveBeenCalledWith('game-1', {
      type: EPlayerInputType.OPTION,
      optionId: 'confirm',
    });
    expect(result.current.pendingInput?.inputId).toBe('input-1');
    expect(result.current.waitingPlayerId).toBe('p1');

    act(() => {
      emitState({ gameId: 'game-1' } as IPublicGameState);
    });

    expect(result.current.pendingInput).toBeNull();
    expect(result.current.waitingPlayerId).toBeNull();
  });
});
