import { useTranslation } from 'react-i18next';
import { EGameEventType, type TGameEvent } from '@/types/re-exports';

interface IEventEntryProps {
  event: TGameEvent;
  playerNames?: Record<string, string>;
  index: number;
}

const EVENT_ICON: Record<EGameEventType, string> = {
  [EGameEventType.ACTION]: '🎯',
  [EGameEventType.FREE_ACTION]: '⚙️',
  [EGameEventType.INPUT]: '✅',
  [EGameEventType.RESOURCE_CHANGE]: '💰',
  [EGameEventType.SCORE_CHANGE]: '⭐',
  [EGameEventType.SECTOR_COMPLETED]: '📡',
  [EGameEventType.ALIEN_DISCOVERED]: '👽',
  [EGameEventType.ROTATION]: '🌀',
  [EGameEventType.ROUND_END]: '⏱️',
  [EGameEventType.GAME_END]: '🏁',
};

function getPlayerName(
  playerId: string,
  playerNames: Record<string, string>,
): string {
  return playerNames[playerId] ?? playerId;
}

function getEventDescription(
  event: TGameEvent,
  playerNames: Record<string, string>,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  switch (event.type) {
    case EGameEventType.ACTION:
      return t('client.event_entry.action', {
        player: getPlayerName(event.playerId, playerNames),
        action: event.action.type,
      });
    case EGameEventType.FREE_ACTION:
      return t('client.event_entry.free_action', {
        player: getPlayerName(event.playerId, playerNames),
        action: event.action.type,
      });
    case EGameEventType.INPUT:
      return t('client.event_entry.input', {
        player: getPlayerName(event.playerId, playerNames),
        response: event.response.type,
      });
    case EGameEventType.RESOURCE_CHANGE:
      return t('client.event_entry.resource_change', {
        player: getPlayerName(event.playerId, playerNames),
        direction:
          event.delta >= 0
            ? t('client.event_entry.gained')
            : t('client.event_entry.lost'),
        amount: Math.abs(event.delta),
        resource: event.resource,
      });
    case EGameEventType.SCORE_CHANGE:
      return t('client.event_entry.score_change', {
        player: getPlayerName(event.playerId, playerNames),
        delta: `${event.delta >= 0 ? '+' : ''}${event.delta}`,
        source: event.source,
      });
    case EGameEventType.SECTOR_COMPLETED:
      return t('client.event_entry.sector_completed', {
        sector: event.sectorId,
        winner: getPlayerName(event.winnerId, playerNames),
      });
    case EGameEventType.ALIEN_DISCOVERED:
      return t('client.event_entry.alien_discovered', {
        alien: event.alienType,
      });
    case EGameEventType.ROTATION:
      return t('client.event_entry.rotation', { disc: event.discIndex + 1 });
    case EGameEventType.ROUND_END:
      return t('client.event_entry.round_end', { round: event.round });
    case EGameEventType.GAME_END:
      return t('client.event_entry.game_end');
    default:
      return t('client.event_entry.unknown');
  }
}

export function EventEntry({
  event,
  playerNames = {},
  index,
}: IEventEntryProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <article
      className='rounded border border-surface-700/55 bg-surface-900/55 px-2 py-1.5'
      data-testid={`event-entry-${index}`}
    >
      <div className='flex items-start gap-2'>
        <span className='mt-0.5 text-sm' aria-hidden>
          {EVENT_ICON[event.type]}
        </span>
        <div className='min-w-0 flex-1'>
          <p className='text-xs text-text-200'>
            {getEventDescription(event, playerNames, t)}
          </p>
          <p className='mt-0.5 font-mono text-[10px] uppercase tracking-wide text-text-500'>
            {event.type}
          </p>
        </div>
        <span className='font-mono text-[10px] text-text-500'>
          #{index + 1}
        </span>
      </div>
    </article>
  );
}
