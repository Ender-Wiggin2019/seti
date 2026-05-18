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
        className='flex min-h-14 flex-col-reverse items-center gap-2'
        data-testid={`alien-${alienIndex}-${area}-column-${color}-slots`}
      >
        {slots.map((slot) => (
          <TraceSlot key={slot.slotId} slot={slot} playerColors={playerColors} />
        ))}
        {slots.length === 0 ? (
          <span
            aria-hidden
            className='mt-1 h-10 w-10 rounded-full border border-dashed border-surface-700/70 bg-surface-950/30'
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

  return (
    <div className='flex shrink-0 flex-col items-center gap-1'>
      <TraceRewardFrame
        traceColor={slot.traceColor}
        variant={isOverflow ? 'pill' : 'circle'}
        testId={`trace-slot-${slot.slotId}-circle`}
        title={`${TRACE_LABEL[slot.traceColor]} slot${isOverflow ? ' (overflow)' : ''}${slot.isDiscovery ? ' - Discovery' : ''}`}
        highlighted={slot.isDiscovery}
      >
        {rewards.length > 0 ? <TraceRewardPresentations presentations={rewards} /> : null}
        {rewards.length === 0 && slot.isDiscovery && (
          <span className='text-[8px] font-bold text-accent-300'>*</span>
        )}
        {rewards.length === 0 && isOverflow && (
          <span className='font-mono text-[8px] text-text-500'>∞</span>
        )}
      </TraceRewardFrame>
      <div className='flex min-h-[14px] flex-wrap justify-center gap-0.5'>
        {slot.occupants.map((occ, index) => (
          <OccupantMarker
            key={`${slot.slotId}-${index}`}
            testId={`trace-slot-${slot.slotId}-occupant-${index}`}
            occupant={occ}
            playerColors={playerColors}
          />
        ))}
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
        variant === 'pill' ? 'min-h-24 w-12 rounded-full px-1 py-2' : 'h-12 w-12 rounded-full',
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

function OccupantMarker({
  occupant,
  playerColors,
  testId,
}: {
  occupant: IPublicTraceSlot['occupants'][number];
  playerColors: Record<string, string>;
  testId: string;
}): React.JSX.Element {
  return (
    <span
      className='inline-block h-2.5 w-2.5 rounded-full border border-surface-200/30'
      data-testid={testId}
      style={{
        backgroundColor:
          occupant.source === 'neutral'
            ? '#9ca3af'
            : (playerColors[occupant.source.playerId] ?? '#cbd5e1'),
      }}
      title={occupant.source === 'neutral' ? 'Neutral' : occupant.source.playerId}
    />
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
  size = 'desc-mini',
}: {
  presentations: TTraceRewardPresentation[];
  size?: 'desc-mini' | 'desc' | 'xxs' | 'xs';
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
  size: 'desc-mini' | 'desc' | 'xxs' | 'xs';
}): React.JSX.Element {
  const testKey = presentation.token.replace(/[{}]/g, '');
  if (presentation.kind === 'text') {
    return (
      <span className='max-w-10 truncate font-mono text-[8px] text-text-300' data-testid={`trace-reward-icon-${testKey}`} title={presentation.label}>
        {presentation.text}
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center justify-center overflow-visible', size === 'xxs' ? 'h-5 w-5' : 'h-4 w-4')} data-testid={`trace-reward-icon-${testKey}`} title={presentation.label}>
      <DescRender desc={presentation.token} size={size} smartSize />
    </span>
  );
}
