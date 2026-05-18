import {
  TRACE_COLUMN_COLORS,
  type TTraceColumnColor,
} from '@seti/common/utils/alienTracePresentation';
import {
  useCalibrationMode,
  usePreviewOverflowCount,
} from '@/hooks/useCalibrationMode';
import { ETrace } from '@/types/re-exports';
import type { IPublicAnomaliesBoard, IPublicTraceSlot } from '@/types/re-exports';
import { AlienBoardArtFrame } from './AlienBoardArtFrame';

type TTraceOccupant = IPublicTraceSlot['occupants'][number];

const TRACE_RING_COLOR: Record<TTraceColumnColor, string> = {
  [ETrace.RED]: '#e93e27',
  [ETrace.YELLOW]: '#f5c242',
  [ETrace.BLUE]: '#3478d8',
};

const TRACE_LETTER: Record<TTraceColumnColor, string> = {
  [ETrace.RED]: 'R',
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
  [ETrace.RED]: {
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
            const slot = board.traceBoard.columns[color];
            const liveOccupants = slot?.occupants ?? [];
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

const PREVIEW_PLAYER_IDS = ['preview-A', 'preview-B', 'preview-C', 'preview-D'];

/**
 * Build a synthesized occupant array for the `?previewOverflow=N` debug flag:
 *   - 4 single-cap occupants to fully fill the printed circles
 *   - N additional overflow occupants stacked on top
 * Live occupants always take priority; only the gap up to 4 + N is filled.
 */
function buildPreviewOccupants(
  live: ReadonlyArray<TTraceOccupant>,
  overflowCount: number,
): TTraceOccupant[] {
  const out: TTraceOccupant[] = [...live];
  const target = 4 + overflowCount;
  let i = 0;
  while (out.length < target) {
    const playerId =
      PREVIEW_PLAYER_IDS[i % PREVIEW_PLAYER_IDS.length] ?? 'preview';
    out.push({
      source: { playerId },
      traceColor: out[0]?.traceColor ?? ETrace.RED,
    });
    i += 1;
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
  occupants: ReadonlyArray<TTraceOccupant>;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const layout = ANOMALIES_LAYOUTS[color];
  const ringColor = TRACE_RING_COLOR[color];
  const singleCapCount = layout.singleCapYPctBottomToTop.length;
  return (
    <div
      data-testid={`alien-${alienIndex}-anomalies-column-${color}`}
      data-trace-color={color}
    >
      {occupants.map((occ, index) => {
        const inOverflow = index >= singleCapCount;
        const overflowIndex = index - singleCapCount;
        const xPct = layout.xPct;
        // Overflow tokens stack upward inside the printed overflow circle:
        // the first one sits centered, the next ones fan above it.
        const yPct = inOverflow
          ? layout.overflowYPct - overflowIndex * layout.overflowStridePct
          : layout.singleCapYPctBottomToTop[index];
        return (
          <SlotMarker
            key={`${color}-${index}`}
            xPct={xPct}
            yPct={yPct}
            occupant={occ}
            playerColors={playerColors}
            ringColor={ringColor}
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
  ringColor,
  testId,
}: {
  xPct: number;
  yPct: number;
  occupant: TTraceOccupant;
  playerColors: Record<string, string>;
  ringColor: string;
  testId: string;
}): React.JSX.Element {
  const playerId =
    occupant.source === 'neutral' ? null : occupant.source.playerId;
  const fill =
    playerId === null
      ? '#9ca3af'
      : (playerColors[playerId] ?? '#cbd5e1');
  return (
    <span
      className='absolute aspect-square w-[8%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_0_4px_rgba(0,0,0,0.6)]'
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        backgroundColor: fill,
        borderColor: ringColor,
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
