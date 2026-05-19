import {
  groupTraceSlotsByColor,
  TRACE_COLUMN_COLORS,
  type TTraceColumnColor,
} from '@seti/common/utils/alienTracePresentation';
import { useCalibrationMode } from '@/hooks/useCalibrationMode';
import type { IPublicTraceSlot } from '@/types/re-exports';
import { ETrace } from '@/types/re-exports';

type TTraceOccupant = IPublicTraceSlot['occupants'][number];

const TRACE_COLOR: Record<TTraceColumnColor, string> = {
  [ETrace.PINK]: '#d63384',
  [ETrace.YELLOW]: '#f5c242',
  [ETrace.BLUE]: '#3478d8',
};

const TRACE_LETTER: Record<TTraceColumnColor, string> = {
  [ETrace.PINK]: 'R',
  [ETrace.YELLOW]: 'Y',
  [ETrace.BLUE]: 'B',
};

export interface ITraceColumnLayout {
  /** Horizontal centre, in % of board width. */
  xPct: number;
  /**
   * Y centre of each printed slot, ordered from bottom-most to top-most.
   * Index N maps to the Nth slot of this colour as received from the server
   * (server inserts trace slots in tier order, so bottom-most VP-rich slot
   * comes first).
   */
  yPctBottomToTop: number[];
  /**
   * Vertical stride (in % of board height) used to stack multiple occupants
   * inside an overflow slot (`maxOccupants === -1`). Each subsequent occupant
   * shifts upward by this amount. Defaults to 4.5%.
   */
  overflowStridePct?: number;
}

export type TTraceColumnLayouts = Record<TTraceColumnColor, ITraceColumnLayout>;

interface ITraceMarkerOverlayProps {
  alienIndex: number;
  alienKey: string;
  traceSlots: IPublicTraceSlot[];
  playerColors: Record<string, string>;
  layouts: TTraceColumnLayouts;
}

/**
 * Overlay player markers onto an alien-board art frame using per-column layouts.
 *
 * Each colour column uses the per-slot Y positions from `layouts[color]`. A
 * single-capacity slot places its occupant at the slot centre; an overflow slot
 * (`maxOccupants === -1`) stacks occupants vertically using `overflowStridePct`.
 */
export function TraceMarkerOverlay({
  alienIndex,
  alienKey,
  traceSlots,
  playerColors,
  layouts,
}: ITraceMarkerOverlayProps): React.JSX.Element {
  const calibrate = useCalibrationMode();
  if (calibrate) {
    return (
      <CalibrationOverlay
        alienIndex={alienIndex}
        alienKey={alienKey}
        traceSlots={traceSlots}
        layouts={layouts}
      />
    );
  }
  const slotsByColor = groupTraceSlotsByColor(traceSlots);
  return (
    <>
      {TRACE_COLUMN_COLORS.map((color) => {
        const layout = layouts[color];
        const slots = slotsByColor[color] ?? [];
        if (!layout || slots.length === 0) return null;
        const stride = layout.overflowStridePct ?? 4.5;
        return (
          <div
            key={color}
            data-testid={`alien-${alienIndex}-${alienKey}-column-${color}`}
            data-trace-color={color}
          >
            {slots.map((slot, slotIndex) => {
              const yPct =
                layout.yPctBottomToTop[slotIndex] ??
                layout.yPctBottomToTop[layout.yPctBottomToTop.length - 1];
              if (yPct === undefined) return null;
              const isOverflow = slot.maxOccupants === -1;
              return slot.occupants.map((occ, occIndex) => {
                // Single-cap slot: stay centered. Overflow: stack upward.
                const occYPct = isOverflow ? yPct - stride * occIndex : yPct;
                return (
                  <SlotMarker
                    key={`${slot.slotId}-${occIndex}`}
                    xPct={layout.xPct}
                    yPct={occYPct}
                    occupant={occ}
                    playerColors={playerColors}
                    testId={`alien-${alienIndex}-${alienKey}-marker-${color}-${slotIndex}-${occIndex}`}
                  />
                );
              });
            })}
          </div>
        );
      })}
    </>
  );
}

function CalibrationOverlay({
  alienIndex,
  alienKey,
  traceSlots,
  layouts,
}: {
  alienIndex: number;
  alienKey: string;
  traceSlots: IPublicTraceSlot[];
  layouts: TTraceColumnLayouts;
}): React.JSX.Element {
  const slotsByColor = groupTraceSlotsByColor(traceSlots);
  return (
    <>
      {TRACE_COLUMN_COLORS.map((color) => {
        const layout = layouts[color];
        if (!layout) return null;
        const slots = slotsByColor[color] ?? [];
        const ringColor = TRACE_COLOR[color];
        const letter = TRACE_LETTER[color];
        return (
          <div key={color} data-trace-color={color}>
            {layout.yPctBottomToTop.map((yPct, index) => {
              const slot = slots[index];
              const isOverflow = slot?.maxOccupants === -1;
              return (
                <span
                  key={`${color}-${index}`}
                  className='absolute flex aspect-square w-[10%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] font-mono text-[9px] font-bold'
                  style={{
                    left: `${layout.xPct}%`,
                    top: `${yPct}%`,
                    borderColor: ringColor,
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    color: ringColor,
                  }}
                  data-testid={`calibrate-${alienKey}-${color}-${index}`}
                  title={`${alienKey} ${letter}${index}${
                    isOverflow ? ' (overflow)' : ''
                  } (x=${layout.xPct}%, y=${yPct}%)`}
                >
                  {letter}
                  {index}
                  {isOverflow ? '*' : ''}
                </span>
              );
            })}
          </div>
        );
      })}
      <span
        className='absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white'
        data-testid={`calibrate-${alienKey}-${alienIndex}-badge`}
      >
        cal · {alienKey}
      </span>
    </>
  );
}

function SlotMarker({
  xPct,
  yPct,
  occupant,
  playerColors,
  testId,
}: {
  xPct: number;
  yPct: number;
  occupant: TTraceOccupant;
  playerColors: Record<string, string>;
  ringColor?: string;
  testId: string;
}): React.JSX.Element {
  const playerId =
    occupant.source === 'neutral' ? null : occupant.source.playerId;
  const fill =
    playerId === null ? '#9ca3af' : (playerColors[playerId] ?? '#cbd5e1');
  return (
    <span
      className='absolute aspect-square w-[8%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50 shadow-[0_0_4px_rgba(0,0,0,0.6)]'
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        backgroundColor: fill,
      }}
      title={playerId ?? 'neutral'}
      data-testid={testId}
    />
  );
}
