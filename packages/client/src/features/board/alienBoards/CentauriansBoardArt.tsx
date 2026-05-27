import type { IPublicCentauriansBoard } from '@/types/re-exports';
import { ETrace } from '@/types/re-exports';
import { AlienBoardArtFrame } from './AlienBoardArtFrame';
import {
  TraceMarkerOverlay,
  type TTraceColumnLayouts,
} from './TraceMarkerOverlay';

// Centaurian reference art shows, per column from bottom to top:
//   tier 1 — "5 VP + 1 alien card" (single-cap)
//   tier 2 — "3 VP + 1 alien card" (single-cap)
//   tier 3 — "5 VP" (single-cap)
//   tier 4 — "15 VP, costs 3 data" (single-cap)
//   tier 5 — "6 VP, costs 1 data" (open area, unlimited capacity)
//
// Server emits all five as trace slots in this order (bottom→top).
// Layout copied from Oumuamua as a starting point — adjust to the
// printed Centaurian board.
const CENTAURIANS_LAYOUTS: TTraceColumnLayouts = {
  [ETrace.PINK]: {
    xPct: 18.6,
    yPctBottomToTop: [83.7, 72.6, 61.5, 50.4, 38],
    overflowStridePct: 1.5,
  },
  [ETrace.YELLOW]: {
    xPct: 49.7,
    yPctBottomToTop: [88.8, 77.7, 66.6, 55.5, 43.1],
    overflowStridePct: 1.5,
  },
  [ETrace.BLUE]: {
    xPct: 81,
    yPctBottomToTop: [83.7, 72.6, 61.5, 50.4, 38],
    overflowStridePct: 1.5,
  },
};

interface ICentauriansBoardArtProps {
  alienIndex: number;
  board: IPublicCentauriansBoard;
  playerColors: Record<string, string>;
}

export function CentauriansBoardArt({
  alienIndex,
  board,
  playerColors,
}: ICentauriansBoardArtProps): React.JSX.Element {
  return (
    <section
      className='min-w-0'
      data-testid={`alien-${alienIndex}-centaurians-board`}
    >
      <AlienBoardArtFrame
        artKey='centaurians'
        alt='Centaurians alien board'
        testId={`alien-${alienIndex}-centaurians-art`}
      >
        <TraceMarkerOverlay
          alienIndex={alienIndex}
          alienKey='centaurians'
          traceSlots={board.traceSlots}
          playerColors={playerColors}
          layouts={CENTAURIANS_LAYOUTS}
        />
      </AlienBoardArtFrame>
    </section>
  );
}
