import { DescRender } from '@seti/cards';
import { OUMUAMUA_TRACE_SLOT_PREFIX } from '@seti/common/constant/alienBoardConfig';
import {
  groupTraceSlotsByColor,
  TRACE_COLUMN_COLORS,
  type TTraceColumnColor,
  type TTraceRewardPresentation,
  toTraceRewardPresentations,
} from '@seti/common/utils/alienTracePresentation';
import { usePreviewOverflowCount } from '@/hooks/useCalibrationMode';
import { cn } from '@/lib/cn';
import type {
  IPublicTraceOccupant,
  IPublicTraceSlot,
  TPublicSlotReward,
} from '@/types/re-exports';
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
  const previewOverflow = usePreviewOverflowCount();
  const decoratedSlots =
    previewOverflow > 0
      ? slots.map((slot) =>
          decorateSlotWithPreviewOccupants(slot, color, previewOverflow),
        )
      : slots;
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
        {decoratedSlots.map((slot) => (
          <TraceSlot
            key={slot.slotId}
            slot={slot}
            playerColors={playerColors}
          />
        ))}
        {decoratedSlots.length === 0 ? (
          <span
            aria-hidden
            className='mt-1 aspect-square w-[78%] max-w-16 rounded-full border border-dashed border-surface-700/70 bg-surface-950/30'
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Synthesise preview occupants for the `?previewOverflow=N` debug flag,
 * applied uniformly to every alien's trace columns. Single-cap slots
 * get one preview occupant if currently empty; the overflow slot
 * (`maxOccupants: -1`) gets N preview occupants on top of any live
 * markers. Player ids cycle through a fixed palette of preview slugs
 * so the existing `playerColors` lookup in `SlotOccupantOverlay`
 * resolves to varied colours; players that aren't in `playerColors`
 * fall back to the palette-coloured stand-ins.
 */
const PREVIEW_PLAYER_IDS = ['preview-A', 'preview-B', 'preview-C', 'preview-D'];

export function decorateSlotWithPreviewOccupants(
  slot: IPublicTraceSlot,
  color: TTraceColumnColor,
  overflowCount: number,
): IPublicTraceSlot {
  const isOverflow = slot.maxOccupants === -1;
  if (slot.occupants.length > 0 && !isOverflow) {
    return slot;
  }
  const additions: IPublicTraceOccupant[] = [];
  if (isOverflow) {
    for (let i = 0; i < overflowCount; i += 1) {
      additions.push({
        source: { playerId: pickPreviewPlayerId(slot.slotId, i) },
        traceColor: color,
      });
    }
  } else if (slot.occupants.length === 0) {
    additions.push({
      source: { playerId: pickPreviewPlayerId(slot.slotId, 0) },
      traceColor: color,
    });
  }
  if (additions.length === 0) return slot;
  return { ...slot, occupants: [...slot.occupants, ...additions] };
}

function pickPreviewPlayerId(slotId: string, index: number): string {
  // Hash slotId so each slot reliably picks a different start in the
  // palette — neighbouring slots end up with different colours, which
  // is what we want to simulate "real" multi-player play.
  let hash = 0;
  for (let i = 0; i < slotId.length; i += 1) {
    hash = (hash * 31 + slotId.charCodeAt(i)) | 0;
  }
  const start = Math.abs(hash) % PREVIEW_PLAYER_IDS.length;
  return (
    PREVIEW_PLAYER_IDS[(start + index) % PREVIEW_PLAYER_IDS.length] ?? 'preview'
  );
}

/**
 * Distinct fallback colours for `?previewOverflow=N` synth occupants
 * whose `playerId` isn't in the live `playerColors` map. Mirrors the
 * 4-player palette (red / blue / green / yellow) so previews look like
 * a real game in progress.
 */
const PREVIEW_PLAYER_FALLBACK_COLORS: Record<string, string> = {
  'preview-A': '#ef4444', // red
  'preview-B': '#3b82f6', // blue
  'preview-C': '#22c55e', // green
  'preview-D': '#eab308', // yellow
};

function fallbackPreviewColor(playerId: string): string {
  return PREVIEW_PLAYER_FALLBACK_COLORS[playerId] ?? '#cbd5e1';
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

/**
 * Oumuamua trace slot ids encode the exofossil cost in the last
 * pipe-separated segment, e.g.
 *   `alien-0-oumuamua-trace|red-trace|1|4`
 * This client-side parser keeps the wire shape unchanged while
 * letting the cost render alongside the bonus circle.
 */
function parseOumuamuaExofossilCost(slotId: string): number {
  if (!slotId.includes(OUMUAMUA_TRACE_SLOT_PREFIX)) return 0;
  const parts = slotId.split('|');
  if (parts.length !== 4) return 0;
  const cost = Number(parts[3]);
  return Number.isInteger(cost) && cost > 0 ? cost : 0;
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
  const exofossilCost = parseOumuamuaExofossilCost(slot.slotId);

  return (
    <div className='relative flex w-[78%] max-w-16 shrink-0 flex-col items-center'>
      <TraceRewardFrame
        traceColor={slot.traceColor}
        variant={isOverflow ? 'pill' : 'circle'}
        testId={`trace-slot-${slot.slotId}-circle`}
        title={`${TRACE_LABEL[slot.traceColor]} slot${isOverflow ? ' (overflow)' : ''}${slot.isDiscovery ? ' - Discovery' : ''}${exofossilCost > 0 ? ` — costs ${exofossilCost} exofossil` : ''}`}
        highlighted={slot.isDiscovery}
      >
        {rewards.length > 0 ? (
          // Wrap onto multiple rows when 3+ rewards. Keeps the headline
          // VP on top and pushes alien-card / exofossil bonuses to a
          // second row so they don't overflow the bonus circle.
          <TraceRewardPresentations
            presentations={rewards}
            wrap={rewards.length >= 3}
          />
        ) : null}
        {rewards.length === 0 && slot.isDiscovery && (
          <span className='text-sm font-bold text-accent-300'>*</span>
        )}
        {rewards.length === 0 && isOverflow && (
          <span className='font-mono text-sm text-text-500'>∞</span>
        )}
      </TraceRewardFrame>
      {exofossilCost > 0 ? (
        <ExofossilCostBadge cost={exofossilCost} />
      ) : null}
      <SlotOccupantOverlay slot={slot} playerColors={playerColors} />
    </div>
  );
}

/**
 * "Costs N fossil" badge pinned to the bottom-right of the bonus circle.
 * Reads left-to-right as "N × fossil" — count first, then a small red
 * cross signalling "cost / subtract", then the fossil icon. The cross
 * is its own glyph rather than an overlay so it doesn't sit on top of
 * the fossil.
 */
function ExofossilCostBadge({ cost }: { cost: number }): React.JSX.Element {
  return (
    <span
      className='pointer-events-none absolute -bottom-1.5 -right-1.5 inline-flex items-center gap-0.5 rounded-full border border-purple-300/70 bg-surface-950/95 px-1.5 py-1 font-mono text-[11px] font-semibold leading-none text-purple-100 shadow-[0_2px_4px_rgba(0,0,0,0.55)]'
      data-testid='trace-slot-exofossil-cost'
      title={`Costs ${cost} exofossil`}
    >
      {/* Red ✕ — pure CSS so the icon scales cleanly with the badge. */}
      <span
        aria-hidden
        className='relative inline-block h-3 w-3 shrink-0'
      >
        <span className='absolute left-1/2 top-1/2 h-[2px] w-[110%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-red-500 shadow-[0_0_2px_rgba(0,0,0,0.6)]' />
        <span className='absolute left-1/2 top-1/2 h-[2px] w-[110%] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-red-500 shadow-[0_0_2px_rgba(0,0,0,0.6)]' />
      </span>
      <span>{cost}</span>
      <img
        src='/assets/seti/aliens/oumuamua/exofossil.webp'
        alt=''
        className='h-4 w-4 select-none'
        style={{ transform: 'rotate(45deg) scale(0.9)' }}
        draggable={false}
      />
    </span>
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
  // Same token size in both circle and overflow pill so they read as
  // identical markers. The pill (taller) stacks tokens vertically
  // *centered* around the slot midline — symmetric, not bottom-up.
  // Stride is in % of slot height. Calibrated to match the
  // Anomalies image-mode overflow stack (≈1.5% of board / ~10% of a
  // 64px-wide pill region), which reads as the visually-correct
  // density. Earlier the stride was 14% which left gaps between tokens.
  const strideTopPct = isOverflow ? 9 : 0;
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
            : (playerColors[occ.source.playerId] ??
              fallbackPreviewColor(occ.source.playerId));
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
  wrap = false,
}: {
  presentations: TTraceRewardPresentation[];
  size?: 'desc-mini' | 'desc' | 'xxs' | 'xs' | 'sm';
  /**
   * When true, render the rewards as a column with the headline (first)
   * reward on its own row and the rest packed flush below. Keeps a
   * 3-reward Oumuamua slot (e.g. 3 VP + alien card + exofossil) inside
   * the bonus circle instead of overflowing horizontally.
   */
  wrap?: boolean;
}): React.JSX.Element {
  if (wrap && presentations.length >= 2) {
    const [headline, ...rest] = presentations;
    return (
      <div className='flex flex-col items-center justify-center gap-0'>
        <div className='flex flex-nowrap items-center justify-center gap-0.5'>
          <TraceRewardPresentationItem presentation={headline} size={size} />
        </div>
        <div className='flex flex-nowrap items-center justify-center gap-0.5'>
          {rest.map((presentation, index) => (
            <TraceRewardPresentationItem
              key={`${presentation.token}-${index}`}
              presentation={presentation}
              size={size}
            />
          ))}
        </div>
      </div>
    );
  }
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
  // High-value score icons (e.g. {score-25}) overlay their value text
  // via `position: absolute; left: -27px` (see icon-value-large in
  // packages/web/src/styles/icon.scss). That offset is tuned for a
  // 50px-wide icon, so in our smaller bonus-circle wrapper the "25"
  // label sits noticeably left of centre. Nudge the icon right by a
  // few px to recover the visual centre. Only applied to score icons
  // with value >= 10 so smaller numbers (1, 2, 3) stay untouched.
  const isLargeScoreIcon =
    presentation.kind === 'icon' &&
    /^\{score-(\d+)\}$/.test(presentation.token) &&
    Number(presentation.token.match(/^\{score-(\d+)\}$/)?.[1] ?? '0') >= 10;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center overflow-visible',
        iconSizeClass,
      )}
      data-testid={`trace-reward-icon-${testKey}`}
      title={presentation.label}
      style={
        isLargeScoreIcon ? { transform: 'translateX(8px)' } : undefined
      }
    >
      <DescRender desc={presentation.token} size={size} smartSize />
    </span>
  );
}
