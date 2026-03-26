import { useNavigate } from '@tanstack/react-router';
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

const STATUS_LABEL = {
  [ERoomStatus.WAITING]: 'Waiting',
  [ERoomStatus.PLAYING]: 'In Progress',
  [ERoomStatus.FINISHED]: 'Finished',
} as const;

export function RoomCard({ room }: IRoomCardProps): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <button
      type='button'
      onClick={() =>
        navigate({ to: '/room/$roomId', params: { roomId: room.id } })
      }
      className={cn(
        'w-full text-left rounded-lg border border-surface-700 bg-surface-900/70 p-4 transition-all',
        'hover:border-accent-500/40 hover:bg-surface-800/70 hover:shadow-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <h3 className='truncate text-sm font-semibold text-text-100'>
            {room.name}
          </h3>
          <p className='mt-1 text-xs text-text-500'>
            Host:{' '}
            <span className='text-text-300'>
              {room.players.find((p) => p.isHost)?.name ?? 'Unknown'}
            </span>
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[room.status]}>
          {STATUS_LABEL[room.status]}
        </Badge>
      </div>
      <div className='mt-3 flex items-center gap-4 text-xs text-text-500'>
        <span className='font-mono'>
          {room.players.length}/{room.options.playerCount} players
        </span>
        {room.options.alienModulesEnabled && (
          <span className='text-accent-400'>Aliens</span>
        )}
        {room.options.turnTimerSeconds > 0 && (
          <span>{room.options.turnTimerSeconds}s timer</span>
        )}
      </div>
    </button>
  );
}
