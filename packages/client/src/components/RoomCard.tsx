import {
  CORE_ALIEN_TYPES,
  isAlienEnabled,
} from '@seti/common/types/protocol/options';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { IRoom } from '@/api/types';
import { ERoomStatus } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { getRequiredHumanPlayerCount, isSoloRoom } from '@/lib/roomOptions';

interface IRoomCardProps {
  room: IRoom;
}

const STATUS_VARIANT = {
  [ERoomStatus.WAITING]: 'info',
  [ERoomStatus.PLAYING]: 'warning',
  [ERoomStatus.FINISHED]: 'neutral',
} as const;

const TERRAIN_ASSETS = [
  'terrain_00_00.webp',
  'terrain_00_01.webp',
  'terrain_00_02.webp',
  'terrain_01_00.webp',
  'terrain_01_01.webp',
  'terrain_01_02.webp',
  'terrain_02_00.webp',
  'terrain_02_01.webp',
  'terrain_02_02.webp',
] as const;

const OBJECT_ASSETS = [
  'objects_00_00.webp',
  'objects_00_01.webp',
  'objects_00_02.webp',
  'objects_01_00.webp',
  'objects_01_01.webp',
  'objects_01_02.webp',
  'objects_02_00.webp',
  'objects_02_01.webp',
  'objects_02_02.webp',
] as const;

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
  const requiredHumanPlayers = getRequiredHumanPlayerCount(room.options);
  const soloMode = isSoloRoom(room.options);

  const sceneIdx = pickTileIndex(room.id);
  const bgTile = `/assets/seti/sprites/${TERRAIN_ASSETS[sceneIdx % TERRAIN_ASSETS.length]}`;
  const accentTile = `/assets/seti/sprites/${OBJECT_ASSETS[sceneIdx % OBJECT_ASSETS.length]}`;

  return (
    <button
      type='button'
      onClick={() =>
        navigate({ to: '/room/$roomId', params: { roomId: room.id } })
      }
      className={cn(
        'mission-panel group w-full rounded-[6px] px-4 py-4 text-left',
        'transition-all duration-200',
        'hover:border-[oklch(0.50_0.10_240/0.7)] hover:-translate-y-[1px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.68_0.11_240)]',
      )}
      data-testid='room-card'
      data-panel-scene='card'
    >
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-[0.42] transition-opacity duration-200 group-hover:opacity-[0.52]'
        style={{
          backgroundImage: `url('${bgTile}')`,
          backgroundSize: 'auto 126%',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <span
        aria-hidden
        className='pointer-events-none absolute -bottom-[22%] right-[-8%] h-40 w-40 opacity-[0.34] mix-blend-screen transition-opacity duration-200 group-hover:opacity-[0.46]'
        style={{
          backgroundImage: `url('${accentTile}')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,oklch(0.07_0.015_260/0.94)_0%,oklch(0.08_0.018_260/0.88)_42%,oklch(0.10_0.022_260/0.62)_60%,oklch(0.10_0.022_260/0.36)_78%,oklch(0.07_0.015_260/0.50)_100%)]'
      />
      <span
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.70_0.10_240/0.6)] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100'
      />

      <div className='relative z-10 space-y-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <p className='micro-label flex items-center gap-2 text-[oklch(0.76_0.08_235)]'>
              <span className='h-px w-5 bg-[var(--signal-blue)]' />
              {room.id.slice(0, 8)}
            </p>
            <h3 className='mt-2 truncate font-display text-base font-medium tracking-tight text-text-100'>
              {room.name}
            </h3>
          </div>
          <div className='flex shrink-0 items-center gap-1.5'>
            {soloMode ? (
              <Badge variant='neutral'>
                {t('client.room_card.solo', { defaultValue: 'Solo' })}
              </Badge>
            ) : null}
            <Badge
              variant={STATUS_VARIANT[room.status]}
              data-testid='room-card-status'
            >
              {statusLabel}
            </Badge>
          </div>
        </div>

        <p className='flex items-center gap-1.5 text-xs text-text-500'>
          <span className='font-mono text-[0.6875rem] uppercase tracking-microlabel'>
            {t('client.room_card.host')}
          </span>
          <span className='text-text-100' data-testid='room-card-host'>
            {hostName}
          </span>
        </p>

        <div className='instrument-tick' />

        <div
          className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs'
          data-testid='room-card-module-readout'
        >
          <span className='flex items-center gap-1.5'>
            <span className='micro-label opacity-70'>
              {t('client.common.crew', { defaultValue: 'Crew' })}
            </span>
            <span
              className='readout text-text-100'
              data-testid='room-card-crew-count'
            >
              {room.players.length}/{requiredHumanPlayers}
            </span>
          </span>

          {soloMode ? (
            <span className='readout text-[oklch(0.78_0.11_240)]'>
              D{room.options.soloDifficulty ?? 1}
            </span>
          ) : null}

          {CORE_ALIEN_TYPES.some((alienType) =>
            isAlienEnabled(room.options, alienType),
          ) && (
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

/**
 * Pick a consistent scene index for a given room id.
 * Simple hash: sum char codes mod asset count.
 */
function pickTileIndex(roomId: string): number {
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash += roomId.charCodeAt(i);
  }
  return hash % TERRAIN_ASSETS.length;
}
