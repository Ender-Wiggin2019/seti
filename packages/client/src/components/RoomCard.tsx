import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { IRoom } from '@/api/types';
import { ERoomStatus } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

interface IRoomCardProps {
  room: IRoom;
}

const STATUS_VARIANT = {
  [ERoomStatus.WAITING]: 'success',
  [ERoomStatus.PLAYING]: 'warning',
  [ERoomStatus.FINISHED]: 'default',
} as const;

/**
 * RoomCard — a mission in the lobby.
 *
 * Each card is a hairline-framed panel. On hover, the frame
 * warms to anodized blue and a subtle top-catch highlight lifts.
 * A bottom instrument-tick marks the status dimension.
 */
export function RoomCard({ room }: IRoomCardProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const statusLabel =
    room.status === ERoomStatus.WAITING
      ? t('client.room_card.status.waiting')
      : room.status === ERoomStatus.PLAYING
        ? t('client.room_card.status.playing')
        : t('client.room_card.status.finished');

  const hostName =
    room.players.find((p) => p.isHost)?.name ?? t('client.common.unknown');

  return (
    <button
      type='button'
      onClick={() =>
        navigate({ to: '/room/$roomId', params: { roomId: room.id } })
      }
      className={cn(
        'group relative w-full overflow-hidden rounded-[6px] text-left',
        'border border-[color:var(--metal-edge-soft)]',
        'bg-[oklch(0.13_0.022_260/0.7)] backdrop-blur-[2px]',
        'shadow-hairline-inset',
        'px-4 py-3.5',
        'transition-all duration-200',
        'hover:border-[oklch(0.50_0.10_240/0.7)] hover:bg-[oklch(0.16_0.025_260/0.8)] hover:-translate-y-[1px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.68_0.11_240)]',
      )}
    >
      {/* Top hairline light-catch — appears on hover. */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.70_0.10_240/0.6)] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100'
      />

      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <h3 className='truncate font-display text-base font-medium tracking-tight text-text-100'>
            {room.name}
          </h3>
          <p className='mt-1 flex items-center gap-1.5 text-xs text-text-500'>
            <span className='font-mono text-[0.6875rem] uppercase tracking-microlabel'>
              {t('client.room_card.host')}
            </span>
            <span className='text-text-200'>{hostName}</span>
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[room.status]}>{statusLabel}</Badge>
      </div>

      {/* Instrument-tick divider before the readout row. */}
      <div className='instrument-tick mt-3 mb-2.5' />

      <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs'>
        <span className='flex items-center gap-1.5'>
          <span className='micro-label opacity-70'>
            {t('client.common.crew', { defaultValue: 'Crew' })}
          </span>
          <span className='readout text-text-100'>
            {room.players.length}/{room.options.playerCount}
          </span>
        </span>

        {room.options.alienModulesEnabled.some((enabled) => enabled) && (
          <span className='flex items-center gap-1'>
            <span className='h-1 w-1 rounded-full bg-[oklch(0.70_0.13_300)]' />
            <span className='font-mono text-[0.6875rem] uppercase tracking-microlabel text-[oklch(0.78_0.11_300)]'>
              {t('client.room_card.aliens')}
            </span>
          </span>
        )}

        {room.options.timerPerTurn > 0 && (
          <span className='flex items-center gap-1.5 text-text-500'>
            <TimerGlyph />
            <span className='readout'>
              {t('client.room_card.timer', {
                seconds: room.options.timerPerTurn,
              })}
            </span>
          </span>
        )}
      </div>
    </button>
  );
}

function TimerGlyph(): React.JSX.Element {
  return (
    <svg
      viewBox='0 0 12 12'
      className='h-3 w-3 text-text-500'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.1'
      aria-hidden
    >
      <circle cx='6' cy='6' r='4.5' />
      <path d='M6 3v3l2 1' strokeLinecap='round' />
    </svg>
  );
}
