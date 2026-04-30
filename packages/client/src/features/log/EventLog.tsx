import { useDeferredValue, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { IPublicPlayerState, TGameEvent } from '@/types/re-exports';
import { EventEntry } from './EventEntry';

interface IEventLogProps {
  events: TGameEvent[];
  players?: IPublicPlayerState[];
}

/**
 * EventLog — the mission log scroll.
 *
 * The container is a hairline-framed instrument pane with a
 * micro-label header and a live count readout in the corner.
 * Entries stream newest-at-bottom; the pane auto-scrolls on
 * new entries like an oscilloscope trace.
 */
export function EventLog({
  events,
  players = [],
}: IEventLogProps): React.JSX.Element {
  const { t } = useTranslation('common');
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
      <header className='mb-2 flex items-baseline justify-between gap-2'>
        <h3 className='micro-label'>{t('client.event_log.title')}</h3>
        <span className='readout text-[10px] text-text-500'>
          {String(deferredEvents.length).padStart(3, '0')}
        </span>
      </header>
      <ScrollArea
        ref={scrollRef}
        className='max-h-[260px] rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-[oklch(0.09_0.018_260/0.6)] shadow-hairline-inset p-2'
      >
        {deferredEvents.length === 0 ? (
          <p className='text-xs italic text-text-500'>
            {t('client.event_log.empty')}
          </p>
        ) : (
          <div className='flex flex-col gap-1'>
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
