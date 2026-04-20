import { useTranslation } from 'react-i18next';
import type { IRoomPlayer } from '@/api/types';
import { cn } from '@/lib/cn';

interface IPlayerSlotProps {
  player: IRoomPlayer | null;
  seatIndex: number;
  isCurrentUser: boolean;
}

/**
 * Seat colors as tuned OKLCH — the old pure Tailwind primaries
 * (red-500, blue-500, green-500, yellow-500) all jumped out of the
 * dark instrument context. These values share a common luminance band
 * (~0.55) with calibrated chroma so they read as 4 distinct crew
 * signals without screaming over the rest of the UI.
 */
const SEAT_SIGNALS: Array<{ bar: string; dot: string; label: string }> = [
  {
    bar: 'oklch(0.58 0.13 25)',
    dot: 'oklch(0.72 0.15 25)',
    label: 'CRW-01',
  },
  {
    bar: 'oklch(0.60 0.12 220)',
    dot: 'oklch(0.75 0.13 220)',
    label: 'CRW-02',
  },
  {
    bar: 'oklch(0.58 0.12 150)',
    dot: 'oklch(0.74 0.13 150)',
    label: 'CRW-03',
  },
  {
    bar: 'oklch(0.72 0.13 85)',
    dot: 'oklch(0.82 0.14 85)',
    label: 'CRW-04',
  },
];

/**
 * PlayerSlot — one crew berth.
 *
 * Each slot is a hairline-framed row with a thin seat-signal strip
 * on the left edge (2px) and a small monogram chip. Only the signal
 * strip uses seat-specific color — the rest of the row stays in the
 * ambient instrument palette so 4 seats never clash.
 */
export function PlayerSlot({
  player,
  seatIndex,
  isCurrentUser,
}: IPlayerSlotProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const signal = SEAT_SIGNALS[seatIndex % SEAT_SIGNALS.length];

  if (!player) {
    return (
      <div
        className={cn(
          'relative flex h-14 items-center gap-3 overflow-hidden rounded-[4px]',
          'border border-dashed border-[color:var(--metal-edge-soft)]',
          'bg-[oklch(0.10_0.02_260/0.4)] px-4',
        )}
      >
        <span
          aria-hidden
          className='absolute inset-y-0 left-0 w-[2px] bg-[color:var(--metal-edge-soft)]'
        />
        <span className='font-mono text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
          {signal.label}
        </span>
        <span className='flex-1 border-b border-dashed border-[color:var(--metal-edge-soft)] opacity-60' />
        <span className='text-xs italic text-text-500'>
          {t('client.player_slot.empty', { index: seatIndex + 1 })}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex h-14 items-center gap-3 overflow-hidden rounded-[4px] px-4',
        'border border-[color:var(--metal-edge-soft)]',
        'bg-[oklch(0.15_0.025_260/0.8)]',
        'shadow-hairline-inset',
        isCurrentUser && 'ring-1 ring-[oklch(0.68_0.11_240/0.5)] ring-offset-0',
      )}
    >
      {/* Seat signal bar: a clean 2px vertical ident. */}
      <span
        aria-hidden
        className='absolute inset-y-0 left-0 w-[2px]'
        style={{ backgroundColor: signal.bar }}
      />

      {/* Monogram chip — bevelled, ambient. */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          'border border-[color:var(--metal-edge)]',
          'bg-gradient-to-b from-[oklch(0.24_0.03_260)] to-[oklch(0.17_0.025_260)]',
          'font-display text-sm font-semibold text-text-100',
          'shadow-[inset_0_1px_0_oklch(0.40_0.04_260/0.5)]',
        )}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>

      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium text-text-100'>
          {player.name}
          {isCurrentUser && (
            <span className='ml-1.5 font-mono text-[0.6875rem] uppercase tracking-microlabel text-[oklch(0.82_0.10_240)]'>
              {t('client.player_slot.you')}
            </span>
          )}
        </p>
        <p className='flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
          {player.isHost ? (
            <>
              <span
                className='h-1.5 w-1.5 rounded-full'
                style={{ backgroundColor: signal.dot }}
              />
              {t('client.player_slot.host')}
            </>
          ) : player.ready ? (
            <>
              <span className='h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.14_150)]' />
              {t('client.player_slot.ready')}
            </>
          ) : (
            <>
              <span className='h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.02_260)]' />
              {t('client.player_slot.not_ready')}
            </>
          )}
        </p>
      </div>

      <span
        className='font-mono text-[0.6875rem] uppercase tracking-microlabel text-text-500'
        aria-hidden
      >
        {signal.label}
      </span>
    </div>
  );
}
