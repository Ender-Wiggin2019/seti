import { DescRender } from '@seti/cards';
import {
  groupTraceSlotsByColor,
  TRACE_COLUMN_COLORS,
  type TTraceColumnColor,
  type TTraceRewardPresentation,
  toTraceRewardPresentations,
} from '@seti/common/utils/alienTracePresentation';
import { cn } from '@/lib/cn';
import type { IPublicTraceSlot, TPublicSlotReward } from '@/types/re-exports';
import { ETrace } from '@/types/re-exports';

const TRACE_COLOR: Record<ETrace, string> = {
  [ETrace.PINK]: '#d63384',
  [ETrace.YELLOW]: '#f5c242',
  [ETrace.BLUE]: '#3478d8',
  [ETrace.ANY]: '#6b7280',
};

const TRACE_LABEL: Record<ETrace, string> = {
  [ETrace.PINK]: 'Pink',
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
          <TraceSlot
            key={slot.slotId}
            slot={slot}
            playerColors={playerColors}
          />
        ))}
        {slots.length === 0 ? (
          <span
            aria-hidden
            className='mt-1 aspect-square w-[78%] max-w-16 rounded-full border border-dashed border-surface-700/70 bg-surface-950/30'
          />
        ) : null}
      </div>
    </div>
  );
}

function TraceColumnLabel({
  color,
}: {
  color: TTraceColumnColor;
}): React.JSX.Element {
  return (
    <div className='mb-2 space-y-1'>
      <div
        className='h-1 rounded-full'
        style={{ backgroundColor: TRACE_COLOR[color] }}
        title={TRACE_LABEL[color]}
      />
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

  return (
    <div className='relative flex w-[78%] max-w-16 shrink-0 flex-col items-center'>
      <TraceRewardFrame
        traceColor={slot.traceColor}
        variant={isOverflow ? 'pill' : 'circle'}
        testId={`trace-slot-${slot.slotId}-circle`}
        title={`${TRACE_LABEL[slot.traceColor]} slot${isOverflow ? ' (overflow)' : ''}${slot.isDiscovery ? ' - Discovery' : ''}`}
        highlighted={slot.isDiscovery}
      >
        {rewards.length > 0 ? (
          <TraceRewardPresentations presentations={rewards} />
        ) : null}
        {rewards.length === 0 && slot.isDiscovery && (
          <span className='text-sm font-bold text-accent-300'>*</span>
        )}
        {rewards.length === 0 && isOverflow && (
          <span className='font-mono text-sm text-text-500'>∞</span>
        )}
      </TraceRewardFrame>
      <SlotOccupantOverlay slot={slot} playerColors={playerColors} />
    </div>
  );
}

/**
 * Overlay player tokens directly on the bonus circle/pill — same visual
 * language as the printed alien-board markers. Tokens are sized as a
 * percentage of the circle so they scale together when the column resizes.
 * No trace-color ring (the slot's own border already conveys color); a thin
 * dark border keeps the token readable on light player colors.
 */
export function SlotOccupantOverlay({
  slot,
  playerColors,
}: {
  slot: IPublicTraceSlot;
  ringColor?: string;
  playerColors: Record<string, string>;
}): React.JSX.Element | null {
  if (slot.occupants.length === 0) return null;
  const isOverflow = slot.maxOccupants === -1;
  // Same token size in both circle and overflow pill so they read as identical
  // markers. Pill (taller) stacks tokens vertically *centered* around the slot
  // midline — like the Anomalies overflow ladder, but symmetric instead of
  // bottom-up. Stride is in % of slot height; tighter than token size so dots
  // overlap and read as a stack rather than a single dot.
  const strideTopPct = isOverflow ? 14 : 0;
  const tokenSizePct = 55;
  const occCount = slot.occupants.length;
  // Centre the stack: shift the median occupant to slot midline (50%) by
  // offsetting the whole stack by half its total stride.
  const stackCenterOffsetPct = ((occCount - 1) * strideTopPct) / 2;
  return (
    <div className='pointer-events-none absolute inset-0'>
      {slot.occupants.map((occ, index) => {
        const fill =
          occ.source === 'neutral'
            ? '#9ca3af'
            : (playerColors[occ.source.playerId] ?? '#cbd5e1');
        // First occupant ends up below the centre; last occupant above it.
        const topPct = 50 + stackCenterOffsetPct - strideTopPct * index;
        return (
          <span
            key={`${slot.slotId}-${index}`}
            className='absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50 shadow-[0_0_4px_rgba(0,0,0,0.6)]'
            data-testid={`trace-slot-${slot.slotId}-occupant-${index}`}
            style={{
              left: '50%',
              top: `${topPct}%`,
              width: `${tokenSizePct}%`,
              aspectRatio: '1 / 1',
              backgroundColor: fill,
            }}
            title={occ.source === 'neutral' ? 'Neutral' : occ.source.playerId}
          />
        );
      })}
    </div>
  );
}

type TTraceRewardFrameVariant = 'circle' | 'pill';

export function TraceRewardFrame({
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
        'flex w-full items-center justify-center border-2 bg-surface-950/70',
        // Aspect ratio sets the height; width is driven by the parent
        // TraceSlot wrapper so circle + tokens scale with column width.
        variant === 'pill'
          ? 'aspect-[1/2] rounded-full px-1 py-2'
          : 'aspect-square rounded-full',
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
  size?: 'desc-mini' | 'desc' | 'xxs' | 'xs' | 'sm';
}): React.JSX.Element {
  return (
    <TraceRewardPresentations
      presentations={toTraceRewardPresentations(rewards)}
      size={size}
    />
  );
}

function TraceRewardPresentations({
  presentations,
  size = 'sm',
}: {
  presentations: TTraceRewardPresentation[];
  size?: 'desc-mini' | 'desc' | 'xxs' | 'xs' | 'sm';
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-nowrap items-center justify-center',
        size === 'xxs' ? 'gap-0' : 'gap-0.5',
      )}
    >
      {presentations.map((presentation, index) => (
        <TraceRewardPresentationItem
          key={`${presentation.token}-${index}`}
          presentation={presentation}
          size={size}
        />
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
      <span
        className='max-w-12 truncate font-mono text-[10px] text-text-300'
        data-testid={`trace-reward-icon-${testKey}`}
        title={presentation.label}
      >
        {presentation.text}
      </span>
    );
  }
  const iconSizeClass =
    size === 'sm' ? 'h-6 w-6' : size === 'xxs' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center overflow-visible',
        iconSizeClass,
      )}
      data-testid={`trace-reward-icon-${testKey}`}
      title={presentation.label}
    >
      <DescRender desc={presentation.token} size={size} smartSize />
    </span>
  );
}
