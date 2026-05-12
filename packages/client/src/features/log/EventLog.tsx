import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/cn';
import {
  EGameEventType,
  type IPublicPlayerState,
  type TGameEvent,
} from '@/types/re-exports';
import { EventEntry } from './EventEntry';

interface IEventLogProps {
  events: TGameEvent[];
  players?: IPublicPlayerState[];
  className?: string;
  compact?: boolean;
  showHeader?: boolean;
  scrollAreaClassName?: string;
}

const COMPACT_INTERNAL_ACTIONS = new Set([
  'ACTION_COST',
  'ACTION_REWARD',
  'MILESTONE_CHECK',
]);

function getMainActionToken(event: TGameEvent): string | null {
  if (event.type !== EGameEventType.ACTION) {
    return null;
  }
  return typeof event.action === 'string' ? event.action : event.action.type;
}

function isCompactEventCandidate(event: TGameEvent): boolean {
  if (event.level === 'debug') {
    return false;
  }

  const actionToken = getMainActionToken(event);
  return actionToken === null || !COMPACT_INTERNAL_ACTIONS.has(actionToken);
}

function getCompactEvents(events: TGameEvent[]): TGameEvent[] {
  const candidates = events.filter(isCompactEventCandidate);
  return (candidates.length > 0 ? candidates : events).slice(0, 2);
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
  className,
  compact = false,
  showHeader = true,
  scrollAreaClassName,
}: IEventLogProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const deferredEvents = useDeferredValue(events);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    scrollRef.current.scrollTop = 0;
  }, [deferredEvents.length]);

  if (compact) {
    const compactEvents = getCompactEvents(deferredEvents);

    return (
      <section className={className}>
        <div
          role='button'
          tabIndex={0}
          data-testid='event-log-compact'
          className={cn(
            'cursor-pointer',
            'w-full border-t border-[color:var(--metal-edge-soft)] bg-background-950/90 px-3 py-2 text-left',
            'shadow-hairline-inset transition-[background,border-color] hover:bg-background-900/95',
          )}
          onClick={() => setDialogOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setDialogOpen(true);
            }
          }}
        >
          <div className='mb-1 flex items-center justify-between gap-2'>
            <span className='micro-label'>
              {t('client.event_log.latest', { defaultValue: 'Latest Log' })}
            </span>
            <span className='readout text-[10px] text-text-500'>
              {String(deferredEvents.length).padStart(3, '0')}
            </span>
          </div>
          <div className='max-h-16 overflow-y-auto'>
            {compactEvents.length === 0 ? (
              <p className='text-xs italic text-text-500'>
                {t('client.event_log.empty')}
              </p>
            ) : (
              <div className='flex flex-col gap-1'>
                {compactEvents.map((event, index) => (
                  <EventEntry
                    key={
                      event.id ?? `${event.type}-${event.at ?? index}-${index}`
                    }
                    event={event}
                    playerNames={playerNames}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className='max-h-[80vh] max-w-2xl overflow-hidden p-0'>
            <DialogHeader className='px-4 pt-4'>
              <DialogTitle>{t('client.event_log.title')}</DialogTitle>
            </DialogHeader>
            <div className='px-4 pb-4'>
              <EventLog
                events={deferredEvents}
                players={players}
                scrollAreaClassName='max-h-[68vh]'
                showHeader={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      </section>
    );
  }

  return (
    <section data-testid='event-log' className={className}>
      {showHeader ? (
        <header className='mb-2 flex items-baseline justify-between gap-2'>
          <h3 className='micro-label'>{t('client.event_log.title')}</h3>
          <span className='readout text-[10px] text-text-500'>
            {String(deferredEvents.length).padStart(3, '0')}
          </span>
        </header>
      ) : null}
      <ScrollArea
        ref={scrollRef}
        className={cn(
          'max-h-[260px] rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-[oklch(0.09_0.018_260/0.6)] shadow-hairline-inset p-2',
          scrollAreaClassName,
        )}
      >
        {deferredEvents.length === 0 ? (
          <p className='text-xs italic text-text-500'>
            {t('client.event_log.empty')}
          </p>
        ) : (
          <div className='flex flex-col gap-1'>
            {deferredEvents.map((event, index) => (
              <EventEntry
                key={event.id ?? `${event.type}-${event.at ?? index}-${index}`}
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
