import { useCallback, useEffect, useState } from 'react';
import { wsClient } from '@/api/wsClient';
import type { TGameEvent } from '@/types/re-exports';

const MAX_EVENTS = 100;

export function useGameEvents(): TGameEvent[] {
  const [events, setEvents] = useState<TGameEvent[]>([]);

  const handleEvent = useCallback((event: TGameEvent) => {
    setEvents((prev) => {
      const next = [event, ...prev];
      return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
    });
  }, []);

  useEffect(() => {
    wsClient.onEvent(handleEvent);
    return () => {
      wsClient.offEvent();
    };
  }, [handleEvent]);

  return events;
}
