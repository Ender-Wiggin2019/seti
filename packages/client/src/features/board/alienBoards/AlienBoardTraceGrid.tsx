import { DescRender } from '@seti/cards';
import { ETrace } from '@/types/re-exports';
import type { IPublicTraceSlot, TPublicSlotReward } from '@/types/re-exports';
import {
  groupTraceSlotsByColor,
  TRACE_COLUMN_COLORS,
  type TTraceColumnColor,
  type TTraceRewardPresentation,
  toTraceRewardPresentations,
} from '@seti/common/utils/alienTracePresentation';
import { cn } from '@/lib/cn';

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

export function TraceColumnGrid({
  alienIndex,
  area,
  slots,
  playerColors,
}: {
  alienIndex: number;
  area: string;
  slots: IPublicTraceSlot[];
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const groupedSlots = groupTraceSlotsByColor(slots);

  return (
    <div className='grid min-w-0 grid-cols-3 gap-2'>
      {TRACE_COLUMN_COLORS.map((color) => (
        <TraceColorColumn
          key={color}
          alienIndex={alienIndex}
          area={area}
          color={color}
          slots={groupedSlots[color]}
          playerColors={playerColors}
        />
      ))}
    </div>
  );
}

function TraceColorColumn({
  alienIndex,
  area,
  color,
  slots,
  playerColors,
}: {
  alienIndex: number;
  area: string;
  color: TTraceColumnColor;
  slots: IPublicTraceSlot[];
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <div
      className='min-w-0 rounded border border-surface-700/50 bg-surface-900/30 p-2'
      data-testid={`alien-${alienIndex}-${area}-column-${color}`}
    >
      <TraceColumnLabel color={color} />
      <div
        className='flex min-h-16 flex-col-reverse items-center gap-2'
        data-testid={`alien-${alienIndex}-${area}-column-${color}-slots`}
      >
        {slots.map((slot) => (
          <TraceSlot key={slot.slotId} slot={slot} playerColors={playerColors} />
        ))}
        {slots.length === 0 ? (
          <span
            aria-hidden
            className='mt-1 h-14 w-14 rounded-full border border-dashed border-surface-700/70 bg-surface-950/30'
          />
        ) : null}
      </div>
    </div>
  );
}

function TraceColumnLabel({ color }: { color: TTraceColumnColor }): React.JSX.Element {
  return (
    <div className='mb-2 space-y-1'>
      <div className='h-1 rounded-full' style={{ backgroundColor: TRACE_COLOR[color] }} title={TRACE_LABEL[color]} />
      <div className='text-center font-mono text-[9px] uppercase tracking-[0.12em] text-text-500'>
        {TRACE_LABEL[color]}
      </div>
    </div>
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
  const rewards = toTraceRewardPresentations(slot.rewards);
  const ringColor = TRACE_COLOR[slot.traceColor];

  return (
    <div className='relative flex shrink-0 flex-col items-center'>
      <TraceRewardFrame
        traceColor={slot.traceColor}
        variant={isOverflow ? 'pill' : 'circle'}
        testId={`trace-slot-${slot.slotId}-circle`}
        title={`${TRACE_LABEL[slot.traceColor]} slot${isOverflow ? ' (overflow)' : ''}${slot.isDiscovery ? ' - Discovery' : ''}`}
        highlighted={slot.isDiscovery}
      >
        {rewards.length > 0 ? <TraceRewardPresentations presentations={rewards} /> : null}
        {rewards.length === 0 && slot.isDiscovery && (
          <span className='text-sm font-bold text-accent-300'>*</span>
        )}
        {rewards.length === 0 && isOverflow && (
          <span className='font-mono text-sm text-text-500'>∞</span>
        )}
      </TraceRewardFrame>
      <SlotOccupantOverlay
        slot={slot}
        ringColor={ringColor}
        playerColors={playerColors}
      />
    </div>
  );
}

/**
 * Overlay player tokens directly on the bonus circle/pill, the same way the
 * Anomalies overflow column stacks tokens. Each occupant is a player-coloured
 * dot ringed in the trace colour, offset vertically so multiple occupants are
 * visible without stacking exactly on top of each other.
 */
function SlotOccupantOverlay({
  slot,
  ringColor,
  playerColors,
}: {
  slot: IPublicTraceSlot;
  ringColor: string;
  playerColors: Record<string, string>;
}): React.JSX.Element | null {
  if (slot.occupants.length === 0) return null;
  const isOverflow = slot.maxOccupants === -1;
  // Pill (overflow) is taller, give more vertical room. Plain circle: pack
  // dots tightly so multiple players are still visible.
  const strideRem = isOverflow ? 0.7 : 0.45;
  return (
    <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
      <div className='relative h-full w-full'>
        {slot.occupants.map((occ, index) => {
          const fill =
            occ.source === 'neutral'
              ? '#9ca3af'
              : (playerColors[occ.source.playerId] ?? '#cbd5e1');
          // First occupant centered; each subsequent one shifts upward.
          const offsetRem = -(index * strideRem);
          return (
            <span
              key={`${slot.slotId}-${index}`}
              className='absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_0_4px_rgba(0,0,0,0.6)]'
              data-testid={`trace-slot-${slot.slotId}-occupant-${index}`}
              style={{
                marginTop: `${offsetRem}rem`,
                backgroundColor: fill,
                borderColor: ringColor,
              }}
              title={
                occ.source === 'neutral' ? 'Neutral' : occ.source.playerId
              }
            />
          );
        })}
      </div>
    </div>
  );
}

type TTraceRewardFrameVariant = 'circle' | 'pill';

function TraceRewardFrame({
  traceColor,
  variant,
  testId,
  title,
  highlighted = false,
  children,
}: {
  traceColor: ETrace;
  variant: TTraceRewardFrameVariant;
  testId: string;
  title: string;
  highlighted?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  const color = TRACE_COLOR[traceColor];
  return (
    <div
      className={cn(
        'flex items-center justify-center border-2 bg-surface-950/70',
        variant === 'pill' ? 'min-h-32 w-16 rounded-full px-1 py-2' : 'h-16 w-16 rounded-full',
        highlighted && 'ring-1 ring-accent-400/50',
      )}
      data-testid={testId}
      data-trace-color={traceColor}
      style={{ backgroundColor: `${color}1f`, borderColor: color }}
      title={title}
    >
      {children}
    </div>
  );
}

export function TraceRewardIcons({
  rewards,
  size = 'desc-mini',
}: {
  rewards: readonly TPublicSlotReward[];
  size?: 'desc-mini' | 'desc' | 'xxs' | 'xs';
}): React.JSX.Element {
  return <TraceRewardPresentations presentations={toTraceRewardPresentations(rewards)} size={size} />;
}

function TraceRewardPresentations({
  presentations,
  size = 'sm',
}: {
  presentations: TTraceRewardPresentation[];
  size?: 'desc-mini' | 'desc' | 'xxs' | 'xs' | 'sm';
}): React.JSX.Element {
  return (
    <div className={cn('flex flex-nowrap items-center justify-center', size === 'xxs' ? 'gap-0' : 'gap-0.5')}>
      {presentations.map((presentation, index) => (
        <TraceRewardPresentationItem key={`${presentation.token}-${index}`} presentation={presentation} size={size} />
      ))}
    </div>
  );
}

function TraceRewardPresentationItem({
  presentation,
  size,
}: {
  presentation: TTraceRewardPresentation;
  size: 'desc-mini' | 'desc' | 'xxs' | 'xs' | 'sm';
}): React.JSX.Element {
  const testKey = presentation.token.replace(/[{}]/g, '');
  if (presentation.kind === 'text') {
    return (
      <span className='max-w-12 truncate font-mono text-[10px] text-text-300' data-testid={`trace-reward-icon-${testKey}`} title={presentation.label}>
        {presentation.text}
      </span>
    );
  }
  const iconSizeClass =
    size === 'sm' ? 'h-6 w-6' : size === 'xxs' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <span className={cn('inline-flex items-center justify-center overflow-visible', iconSizeClass)} data-testid={`trace-reward-icon-${testKey}`} title={presentation.label}>
      <DescRender desc={presentation.token} size={size} smartSize />
    </span>
  );
}
