import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameEvents } from '@/hooks/useGameEvents';
import { EGameEventType, type TGameEvent } from '@/types/re-exports';

const wsMock = vi.hoisted(() => ({
  eventHandlers: new Set<(event: TGameEvent) => void>(),
}));

vi.mock('@/api/wsClient', () => ({
  wsClient: {
    onEvent: vi.fn((handler: (event: TGameEvent) => void) => {
      wsMock.eventHandlers.add(handler);
      return () => wsMock.eventHandlers.delete(handler);
    }),
  },
}));

function emitEvent(event: TGameEvent): void {
  for (const handler of wsMock.eventHandlers) {
    handler(event);
  }
}

function actionEvent(id: string, at = 100): TGameEvent {
  return {
    id,
    type: EGameEventType.ACTION,
    level: 'info',
    at,
    playerId: 'p1',
    action: 'SCAN',
  } as TGameEvent;
}

describe('useGameEvents', () => {
  beforeEach(() => {
    wsMock.eventHandlers.clear();
  });

  it('preserves distinct same-timestamp events by event id', () => {
    const seedEvents = [actionEvent('event-1'), actionEvent('event-2')];
    const { result } = renderHook(() => useGameEvents(seedEvents));

    expect(result.current.map((event) => event.id)).toEqual([
      'event-2',
      'event-1',
    ]);
  });

  it('dedupes seeded and live events by event id', () => {
    const seedEvents = [actionEvent('event-1')];
    const { result } = renderHook(() => useGameEvents(seedEvents));

    act(() => {
      emitEvent(actionEvent('event-1'));
    });

    expect(result.current.map((event) => event.id)).toEqual(['event-1']);
  });

  it('keeps live newest event before older seeded history', () => {
    const { result, rerender } = renderHook(
      ({ seedEvents }) => useGameEvents(seedEvents),
      { initialProps: { seedEvents: [] as TGameEvent[] } },
    );

    act(() => {
      emitEvent(actionEvent('event-2', 200));
    });

    rerender({
      seedEvents: [actionEvent('event-1', 100), actionEvent('event-2', 200)],
    });

    expect(result.current.map((event) => event.id)).toEqual([
      'event-2',
      'event-1',
    ]);
  });
});
