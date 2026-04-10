import { cn } from '@/lib/cn';
import type {
  IPublicAlienState,
  IPublicTraceSlot,
  TPublicSlotReward,
} from '@/types/re-exports';
import { EAlienType, ETrace } from '@/types/re-exports';

const ALIEN_TYPE_LABEL: Partial<Record<EAlienType, string>> = {
  [EAlienType.ANOMALIES]: 'Anomalies',
  [EAlienType.CENTAURIANS]: 'Centaurians',
  [EAlienType.EXERTIANS]: 'Exertians',
  [EAlienType.MASCAMITES]: 'Mascamites',
  [EAlienType.OUMUAMUA]: 'Oumuamua',
  [EAlienType.AMOEBA]: 'Amoeba',
  [EAlienType.GLYPHIDS]: 'Glyphids',
  [EAlienType.DUMMY]: 'Dummy',
};

const TRACE_COLOR: Record<ETrace, string> = {
  [ETrace.RED]: '#e93e27',
  [ETrace.YELLOW]: '#f5c242',
  [ETrace.BLUE]: '#3478d8',
  [ETrace.ANY]: '#6b7280',
};

const TRACE_LABEL: Record<ETrace, string> = {
  [ETrace.RED]: 'Red',
  [ETrace.YELLOW]: 'Yellow',
  [ETrace.BLUE]: 'Blue',
  [ETrace.ANY]: 'Any',
};

interface IAlienBoardViewProps {
  aliens: IPublicAlienState[];
  playerColors: Record<string, string>;
}

export function AlienBoardView({
  aliens,
  playerColors,
}: IAlienBoardViewProps): React.JSX.Element {
  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          Alien Discovery
        </h2>
      </header>

      <div className='grid gap-3 sm:grid-cols-2'>
        {aliens.map((alien) => (
          <AlienCard
            key={alien.alienIndex}
            alien={alien}
            playerColors={playerColors}
          />
        ))}
      </div>
    </section>
  );
}

function AlienCard({
  alien,
  playerColors,
}: {
  alien: IPublicAlienState;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const title =
    alien.discovered && alien.alienType != null
      ? (ALIEN_TYPE_LABEL[alien.alienType] ?? `Alien ${alien.alienIndex + 1}`)
      : `Alien ${alien.alienIndex + 1}`;

  return (
    <article className='rounded-md border border-surface-700/50 bg-surface-900/60 p-3'>
      <div className='flex items-center justify-between'>
        <h3 className='font-mono text-xs font-semibold uppercase tracking-wider text-text-200'>
          {title}
        </h3>
        <span
          className={cn(
            'rounded border px-1.5 py-0.5 font-mono text-[10px]',
            alien.discovered
              ? 'border-green-500/70 bg-green-500/10 text-green-300'
              : 'border-surface-600 bg-surface-800/50 text-text-500',
          )}
        >
          {alien.discovered ? 'Discovered' : 'Unknown'}
        </span>
      </div>

      {/* Trace slots */}
      <div className='mt-3 flex flex-wrap items-start gap-2'>
        {alien.slots.map((slot) => (
          <TraceSlot
            key={slot.slotId}
            slot={slot}
            playerColors={playerColors}
          />
        ))}
      </div>
    </article>
  );
}

function TraceSlot({
  slot,
  playerColors,
}: {
  slot: IPublicTraceSlot;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const isOverflow = slot.maxOccupants === -1;
  const traceColor = TRACE_COLOR[slot.traceColor];
  const rewardLabel = formatRewards(slot.rewards);

  return (
    <div className='flex flex-col items-center gap-1'>
      {/* The slot circle */}
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          isOverflow
            ? 'border-2 border-dashed border-surface-500/70 bg-surface-800/50'
            : 'border-2 border-surface-600/80',
          slot.isDiscovery && 'ring-1 ring-accent-400/50',
        )}
        style={
          !isOverflow
            ? {
                backgroundColor: `${traceColor}33`,
                borderColor: `${traceColor}99`,
              }
            : undefined
        }
        title={`${TRACE_LABEL[slot.traceColor]} slot${isOverflow ? ' (overflow)' : ''}${slot.isDiscovery ? ' — Discovery!' : ''}`}
      >
        {slot.isDiscovery && (
          <span className='text-[8px] font-bold text-accent-300'>★</span>
        )}
        {isOverflow && (
          <span className='font-mono text-[8px] text-text-500'>∞</span>
        )}
      </div>

      {/* Occupants */}
      <div className='flex min-h-[14px] flex-wrap justify-center gap-0.5'>
        {slot.occupants.map((occ, i) => (
          <span
            key={i}
            className='inline-block h-2.5 w-2.5 rounded-full border border-surface-200/30'
            style={{
              backgroundColor:
                occ.source === 'neutral'
                  ? '#9ca3af'
                  : (playerColors[occ.source.playerId] ?? '#cbd5e1'),
            }}
            title={occ.source === 'neutral' ? 'Neutral' : occ.source.playerId}
          />
        ))}
      </div>

      {/* Reward label */}
      {rewardLabel && (
        <span className='font-mono text-[9px] text-text-400'>
          {rewardLabel}
        </span>
      )}
    </div>
  );
}

function formatRewards(rewards: TPublicSlotReward[]): string {
  if (rewards.length === 0) return '';
  return rewards
    .map((r) => {
      if (r.type === 'VP') return `${r.amount}VP`;
      if (r.type === 'PUBLICITY') return `${r.amount}PR`;
      return r.effectId;
    })
    .join(', ');
}
