import { useCallback, useEffect, useState } from 'react';
import { wsClient } from '@/api/wsClient';
import type { TGameEvent } from '@/types/re-exports';

const MAX_EVENTS = 100;

export function useGameEvents(seedEvents: TGameEvent[] = []): TGameEvent[] {
  const [events, setEvents] = useState<TGameEvent[]>([]);

  const handleEvent = useCallback((event: TGameEvent) => {
    setEvents((prev) => {
      const next = mergeEvents([event], prev);
      if (next === prev) {
        return prev;
      }
      return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
    });
  }, []);

  useEffect(() => {
    if (seedEvents.length === 0) {
      return;
    }

    setEvents((prev) => {
      const next = mergeEvents(seedEvents, prev);
      if (next === prev) {
        return prev;
      }
      return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
    });
  }, [seedEvents]);

  useEffect(() => {
    return wsClient.onEvent(handleEvent);
  }, [handleEvent]);

  return events;
}

function mergeEvents(
  incomingOldestFirst: TGameEvent[],
  currentNewestFirst: TGameEvent[],
): TGameEvent[] {
  const eventsByKey = new Map<string, { event: TGameEvent; order: number }>();
  let added = false;
  let order = 0;

  for (const event of [...currentNewestFirst].reverse()) {
    eventsByKey.set(getEventKey(event), { event, order });
    order += 1;
  }

  for (const event of incomingOldestFirst) {
    const key = getEventKey(event);
    if (eventsByKey.has(key)) {
      continue;
    }
    eventsByKey.set(key, { event, order });
    order += 1;
    added = true;
  }

  if (!added) {
    return currentNewestFirst;
  }

  return [...eventsByKey.values()]
    .sort((left, right) => {
      const timeDelta =
        getEventTimestamp(left.event) - getEventTimestamp(right.event);
      if (timeDelta !== 0) return timeDelta;
      return left.order - right.order;
    })
    .map(({ event }) => event)
    .reverse();
}

function getEventTimestamp(event: TGameEvent): number {
  return 'at' in event && typeof event.at === 'number' ? event.at : 0;
}

function getEventKey(event: TGameEvent): string {
  if (event.id) {
    return `id:${event.id}`;
  }

  const at = 'at' in event && event.at !== undefined ? event.at : '';
  const playerId =
    'playerId' in event && event.playerId !== undefined ? event.playerId : '';
  const action =
    event.type === 'ACTION'
      ? typeof event.action === 'string'
        ? event.action
        : event.action.type
      : event.type === 'FREE_ACTION'
        ? event.action.type
        : '';
  const details =
    'details' in event && event.details !== undefined
      ? JSON.stringify(event.details)
      : '';

  return `${event.type}|${at}|${playerId}|${action}|${details}`;
}
