import { useTranslation } from 'react-i18next';
import type { IRoomPlayer } from '@/api/types';
import { cn } from '@/lib/cn';

interface IPlayerSlotProps {
  player: IRoomPlayer | null;
  seatIndex: number;
  isCurrentUser: boolean;
}

const SEAT_COLORS = [
  'bg-red-500/20 border-red-500/40',
  'bg-blue-500/20 border-blue-500/40',
  'bg-green-500/20 border-green-500/40',
  'bg-yellow-500/20 border-yellow-500/40',
];

export function PlayerSlot({
  player,
  seatIndex,
  isCurrentUser,
}: IPlayerSlotProps): React.JSX.Element {
  const { t } = useTranslation('common');
  if (!player) {
    return (
      <div className='flex h-16 items-center justify-center rounded-lg border border-dashed border-surface-700/80 bg-surface-900/30 text-sm text-text-500'>
        {t('client.player_slot.empty', { index: seatIndex + 1 })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-16 items-center gap-3 rounded-lg border px-4',
        SEAT_COLORS[seatIndex % SEAT_COLORS.length],
        isCurrentUser && 'ring-1 ring-accent-400/50',
      )}
    >
      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-surface-800 font-mono text-xs font-bold text-text-100'>
        {player.name.charAt(0).toUpperCase()}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='truncate text-sm font-medium text-text-100'>
          {player.name}
          {isCurrentUser && (
            <span className='ml-1 text-xs text-accent-400'>
              ({t('client.player_slot.you')})
            </span>
          )}
        </p>
        <p className='text-xs text-text-500'>
          {player.isHost
            ? t('client.player_slot.host')
            : player.ready
              ? t('client.player_slot.ready')
              : t('client.player_slot.not_ready')}
        </p>
      </div>
    </div>
  );
}
