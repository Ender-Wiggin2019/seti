import { useDeferredValue, useEffect, useMemo, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { IPublicPlayerState, TGameEvent } from '@/types/re-exports';
import { EventEntry } from './EventEntry';

interface IEventLogProps {
  events: TGameEvent[];
  players?: IPublicPlayerState[];
}

export function EventLog({
  events,
  players = [],
}: IEventLogProps): React.JSX.Element {
  const deferredEvents = useDeferredValue(events);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const playerNames = useMemo(() => {
    return players.reduce<Record<string, string>>((accumulator, player) => {
      accumulator[player.playerId] = player.playerName;
      return accumulator;
    }, {});
  }, [players]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [deferredEvents.length]);

  return (
    <section data-testid='event-log'>
      <h3 className='mb-2 font-mono text-xs font-medium uppercase tracking-widest text-text-500'>
        Event Log
      </h3>
      <ScrollArea
        ref={scrollRef}
        className='max-h-[260px] rounded border border-surface-700/55 bg-surface-950/45 p-2'
      >
        {deferredEvents.length === 0 ? (
          <p className='text-xs italic text-text-500'>No events yet.</p>
        ) : (
          <div className='space-y-1.5'>
            {deferredEvents.map((event, index) => (
              <EventEntry
                key={`${event.type}-${index}`}
                event={event}
                playerNames={playerNames}
                index={index}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </section>
  );
}
