import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayerInput } from '@/hooks/usePlayerInput';
import type { IPlayerInputModel, IPublicGameState } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

const wsMock = vi.hoisted(() => ({
  sendInput: vi.fn(),
  waitingHandlers: new Set<(data: never) => void>(),
}));

vi.mock('@/api/wsClient', () => ({
  wsClient: {
    sendInput: wsMock.sendInput,
    onWaiting: vi.fn((handler: (data: never) => void) => {
      wsMock.waitingHandlers.add(handler);
      return () => wsMock.waitingHandlers.delete(handler);
    }),
  },
}));

function emitWaiting(data: {
  playerId: string;
  input: IPlayerInputModel;
}): void {
  for (const handler of wsMock.waitingHandlers) {
    handler(data as never);
  }
}

function optionInput(inputId: string): IPlayerInputModel {
  return {
    inputId,
    type: EPlayerInputType.OPTION,
    options: [{ id: 'confirm', label: 'Confirm' }],
  } as IPlayerInputModel;
}

function stateWith(pendingInput: IPlayerInputModel | null): IPublicGameState {
  return { gameId: 'game-1', pendingInput } as IPublicGameState;
}

describe('usePlayerInput', () => {
  beforeEach(() => {
    wsMock.sendInput.mockClear();
    wsMock.waitingHandlers.clear();
  });

  it('derives the pending input from authoritative game state', () => {
    const { result } = renderHook(() =>
      usePlayerInput(stateWith(optionInput('input-1')), 'p1'),
    );

    expect(result.current.pendingInput?.inputId).toBe('input-1');
    expect(result.current.waitingPlayerId).toBe('p1');
  });

  it('clears the prompt when authoritative state clears it (no phase heuristic)', () => {
    const { result, rerender } = renderHook(
      ({ gs }: { gs: IPublicGameState | null }) => usePlayerInput(gs, 'p1'),
      { initialProps: { gs: stateWith(optionInput('input-1')) } },
    );

    expect(result.current.pendingInput?.inputId).toBe('input-1');

    rerender({ gs: stateWith(null) });

    expect(result.current.pendingInput).toBeNull();
    expect(result.current.waitingPlayerId).toBeNull();
  });

  it('does not let a stale game:waiting event resurrect a cleared input', () => {
    const { result } = renderHook(() => usePlayerInput(stateWith(null), 'p1'));

    act(() => {
      emitWaiting({ playerId: 'p1', input: optionInput('input-stale') });
    });

    // Authoritative state wins: the input stays cleared.
    expect(result.current.pendingInput).toBeNull();
    expect(result.current.waitingPlayerId).toBeNull();
  });

  it('uses the game:waiting fast-path before the first state frame arrives', () => {
    const { result, rerender } = renderHook(
      ({ gs }: { gs: IPublicGameState | null }) => usePlayerInput(gs, 'p1'),
      { initialProps: { gs: null as IPublicGameState | null } },
    );

    act(() => {
      emitWaiting({ playerId: 'p1', input: optionInput('input-1') });
    });
    expect(result.current.pendingInput?.inputId).toBe('input-1');

    // Once an authoritative frame arrives, it takes over and can clear it.
    rerender({ gs: stateWith(null) });
    expect(result.current.pendingInput).toBeNull();
  });

  it('ignores waiting events addressed to other players', () => {
    const { result } = renderHook(() => usePlayerInput(null, 'p1'));

    act(() => {
      emitWaiting({ playerId: 'p2', input: optionInput('input-1') });
    });

    expect(result.current.pendingInput).toBeNull();
  });

  it('forwards responses to wsClient.sendInput', () => {
    const { result } = renderHook(() =>
      usePlayerInput(stateWith(optionInput('input-1')), 'p1'),
    );

    act(() => {
      result.current.respond('game-1', {
        inputId: 'input-1',
        type: EPlayerInputType.OPTION,
        optionId: 'confirm',
      });
    });

    expect(wsMock.sendInput).toHaveBeenCalledWith('game-1', {
      inputId: 'input-1',
      type: EPlayerInputType.OPTION,
      optionId: 'confirm',
    });
  });
});
