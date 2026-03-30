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
): string {
  switch (event.type) {
    case EGameEventType.ACTION:
      return `${getPlayerName(event.playerId, playerNames)} used ${event.action.type}`;
    case EGameEventType.FREE_ACTION:
      return `${getPlayerName(event.playerId, playerNames)} used free ${event.action.type}`;
    case EGameEventType.INPUT:
      return `${getPlayerName(event.playerId, playerNames)} responded with ${event.response.type}`;
    case EGameEventType.RESOURCE_CHANGE:
      return `${getPlayerName(event.playerId, playerNames)} ${event.delta >= 0 ? 'gained' : 'lost'} ${Math.abs(event.delta)} ${event.resource}`;
    case EGameEventType.SCORE_CHANGE:
      return `${getPlayerName(event.playerId, playerNames)} ${event.delta >= 0 ? '+' : ''}${event.delta} VP (${event.source})`;
    case EGameEventType.SECTOR_COMPLETED:
      return `Sector ${event.sectorId} completed, winner: ${getPlayerName(event.winnerId, playerNames)}`;
    case EGameEventType.ALIEN_DISCOVERED:
      return `Alien discovered: ${event.alienType}`;
    case EGameEventType.ROTATION:
      return `Solar disc ${event.discIndex + 1} rotated`;
    case EGameEventType.ROUND_END:
      return `Round ${event.round} ended`;
    case EGameEventType.GAME_END:
      return 'Game ended';
    default:
      return 'Unknown event';
  }
}

export function EventEntry({
  event,
  playerNames = {},
  index,
}: IEventEntryProps): React.JSX.Element {
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
            {getEventDescription(event, playerNames)}
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
