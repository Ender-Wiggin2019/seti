import {
  TRACE_COLUMN_COLORS,
  type TTraceColumnColor,
} from '@seti/common/utils/alienTracePresentation';
import {
  useCalibrationMode,
  usePreviewOverflowCount,
} from '@/hooks/useCalibrationMode';
import type {
  IPublicAnomaliesBoard,
  IPublicTraceSlot,
} from '@/types/re-exports';
import { ETrace } from '@/types/re-exports';
import { AlienBoardArtFrame } from './AlienBoardArtFrame';

type TTraceOccupant = IPublicTraceSlot['occupants'][number];

const TRACE_RING_COLOR: Record<TTraceColumnColor, string> = {
  [ETrace.PINK]: '#d63384',
  [ETrace.YELLOW]: '#f5c242',
  [ETrace.BLUE]: '#3478d8',
};

const TRACE_LETTER: Record<TTraceColumnColor, string> = {
  [ETrace.PINK]: 'R',
  [ETrace.YELLOW]: 'Y',
  [ETrace.BLUE]: 'B',
};

interface IAnomaliesColumnLayout {
  xPct: number;
  /**
   * Y centres of the 4 single-capacity printed circles, ordered bottom→top.
   * Bottom slot fills first; the 5th+ occupants go to the overflow circle.
   */
  singleCapYPctBottomToTop: [number, number, number, number];
  /** Y centre of the printed overflow circle at the column top. */
  overflowYPct: number;
  /**
   * Vertical stride in % of board height used to stack multiple overflow
   * occupants. Each subsequent overflow token shifts upward by this amount.
   */
  overflowStridePct: number;
}

// Anchor coordinates measured against a 5%-grid overlay on the source PNG.
// Outer columns (R/B) print at the same Y; the middle (Y) column is offset
// downward by ~3% per row (the printed circles in the middle column sit
// about a third of a row lower than the outer columns).
const ANOMALIES_LAYOUTS: Record<TTraceColumnColor, IAnomaliesColumnLayout> = {
  [ETrace.PINK]: {
    xPct: 24,
    singleCapYPctBottomToTop: [81, 71, 61, 51],
    overflowYPct: 39,
    overflowStridePct: 1.5,
  },
  [ETrace.YELLOW]: {
    xPct: 51.8,
    singleCapYPctBottomToTop: [85.6, 75.6, 65.6, 55.6],
    overflowYPct: 43.6,
    overflowStridePct: 1.5,
  },
  [ETrace.BLUE]: {
    xPct: 80,
    singleCapYPctBottomToTop: [81, 71, 61, 51],
    overflowYPct: 39,
    overflowStridePct: 1.5,
  },
};

interface IAnomaliesBoardArtProps {
  alienIndex: number;
  board: IPublicAnomaliesBoard;
  playerColors: Record<string, string>;
}

export function AnomaliesBoardArt({
  alienIndex,
  board,
  playerColors,
}: IAnomaliesBoardArtProps): React.JSX.Element {
  const calibrate = useCalibrationMode();
  const previewOverflow = usePreviewOverflowCount();
  return (
    <section
      className='min-w-0'
      data-testid={`alien-${alienIndex}-anomalies-board`}
    >
      <AlienBoardArtFrame
        artKey='anomalies'
        alt='Anomalies alien board'
        testId={`alien-${alienIndex}-anomalies-art`}
      >
        {calibrate ? (
          <CalibrationOverlay alienIndex={alienIndex} />
        ) : (
          TRACE_COLUMN_COLORS.map((color) => {
            const tierSlots = board.traceBoard.columns[color] ?? [];
            // Build a (tierIndex, occupant) list. Tiers 0..3 are single-cap
            // circles; tier 4 is the overflow circle (any number of tokens).
            const liveOccupants: ITieredOccupant[] = tierSlots.flatMap(
              (slot, tierIndex) =>
                slot.occupants.map((occ) => ({ occ, tierIndex })),
            );
            const occupants =
              previewOverflow > 0
                ? buildPreviewOccupants(liveOccupants, previewOverflow)
                : liveOccupants;
            if (occupants.length === 0) return null;
            return (
              <ColumnMarkers
                key={color}
                alienIndex={alienIndex}
                color={color}
                occupants={occupants}
                playerColors={playerColors}
              />
            );
          })
        )}
      </AlienBoardArtFrame>
    </section>
  );
}

interface ITieredOccupant {
  occ: TTraceOccupant;
  /** 0..3 = single-cap tier (bottom→top); 4 = overflow tier. */
  tierIndex: number;
}

const PREVIEW_PLAYER_IDS = ['preview-A', 'preview-B', 'preview-C', 'preview-D'];

/**
 * Build a synthesized occupant list for the `?previewOverflow=N` debug flag:
 *   - 4 single-cap occupants spread across tiers 0..3 (one per tier)
 *   - N additional overflow occupants on tier 4
 * Live occupants always take priority; only the gap up to 4 + N is filled.
 */
function buildPreviewOccupants(
  live: ReadonlyArray<ITieredOccupant>,
  overflowCount: number,
): ITieredOccupant[] {
  const out: ITieredOccupant[] = [...live];
  // Track which single-cap tiers are filled so we don't double up.
  const filledTiers = new Set(
    live.filter((entry) => entry.tierIndex < 4).map((entry) => entry.tierIndex),
  );
  let preview = 0;
  for (let tier = 0; tier < 4; tier += 1) {
    if (filledTiers.has(tier)) continue;
    const playerId =
      PREVIEW_PLAYER_IDS[preview % PREVIEW_PLAYER_IDS.length] ?? 'preview';
    out.push({
      occ: { source: { playerId }, traceColor: ETrace.PINK },
      tierIndex: tier,
    });
    preview += 1;
  }
  for (let i = 0; i < overflowCount; i += 1) {
    const playerId =
      PREVIEW_PLAYER_IDS[(preview + i) % PREVIEW_PLAYER_IDS.length] ??
      'preview';
    out.push({
      occ: { source: { playerId }, traceColor: ETrace.PINK },
      tierIndex: 4,
    });
  }
  return out;
}

function ColumnMarkers({
  alienIndex,
  color,
  occupants,
  playerColors,
}: {
  alienIndex: number;
  color: TTraceColumnColor;
  occupants: ReadonlyArray<ITieredOccupant>;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const layout = ANOMALIES_LAYOUTS[color];
  // Track how many overflow markers we've already placed so additional ones
  // stack upward inside the overflow circle.
  let overflowOrder = 0;
  return (
    <div
      data-testid={`alien-${alienIndex}-anomalies-column-${color}`}
      data-trace-color={color}
    >
      {occupants.map(({ occ, tierIndex }, index) => {
        const inOverflow = tierIndex >= 4;
        const xPct = layout.xPct;
        let yPct: number;
        if (inOverflow) {
          // First overflow token at centre, subsequent ones fan upward.
          yPct = layout.overflowYPct - overflowOrder * layout.overflowStridePct;
          overflowOrder += 1;
        } else {
          yPct =
            layout.singleCapYPctBottomToTop[tierIndex] ??
            layout.singleCapYPctBottomToTop[
              layout.singleCapYPctBottomToTop.length - 1
            ];
        }
        return (
          <SlotMarker
            key={`${color}-${index}`}
            xPct={xPct}
            yPct={yPct}
            occupant={occ}
            playerColors={playerColors}
            testId={`alien-${alienIndex}-anomalies-marker-${color}-${index}`}
          />
        );
      })}
    </div>
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

function CalibrationOverlay({
  alienIndex,
}: {
  alienIndex: number;
}): React.JSX.Element {
  return (
    <>
      {TRACE_COLUMN_COLORS.map((color) => {
        const layout = ANOMALIES_LAYOUTS[color];
        const ringColor = TRACE_RING_COLOR[color];
        const letter = TRACE_LETTER[color];
        return (
          <div key={color} data-trace-color={color}>
            {layout.singleCapYPctBottomToTop.map((yPct, index) => (
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
                data-testid={`calibrate-anomalies-${color}-${index}`}
                title={`anomalies ${letter}${index} (x=${layout.xPct}%, y=${yPct}%)`}
              >
                {letter}
                {index}
              </span>
            ))}
            <span
              className='absolute flex aspect-square w-[10%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] font-mono text-[9px] font-bold'
              style={{
                left: `${layout.xPct}%`,
                top: `${layout.overflowYPct}%`,
                borderColor: ringColor,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                color: ringColor,
              }}
              data-testid={`calibrate-anomalies-${color}-overflow`}
              title={`anomalies ${letter} overflow (x=${layout.xPct}%, y=${layout.overflowYPct}%)`}
            >
              {letter}∞
            </span>
          </div>
        );
      })}
      <span
        className='absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white'
        data-testid={`calibrate-anomalies-${alienIndex}-badge`}
      >
        cal · anomalies
      </span>
    </>
  );
}
