import type { IPublicOumuamuaBoard } from '@/types/re-exports';
import { ETrace } from '@/types/re-exports';
import { AlienBoardArtFrame } from './AlienBoardArtFrame';
import {
  TraceMarkerOverlay,
  type TTraceColumnLayouts,
} from './TraceMarkerOverlay';

// Oumuamua reference art shows, per column from bottom to top:
//   tier 1 — printed circle "25" (4 exofossils → 25 VP, single-cap)
//   tier 2 — printed circle "3 VP" (single-cap)
//   tier 3 — printed circle "2 VP" (single-cap)
//   tier 4 — printed circle "3 VP + exofossil + pub" (single-cap)
//   tier 5 — printed circle "2 VP + exofossil" (single-cap)
//   tier 6 — overflow bar "6 VP" (1 exofossil, unlimited capacity)
//
// Server emits all six as trace slots in this order (bottom→top), so
// `yPctBottomToTop[i]` is the i-th slot from the bottom.
const OUMUAMUA_LAYOUTS: TTraceColumnLayouts = {
  [ETrace.PINK]: {
    xPct: 19,
    yPctBottomToTop: [86, 75, 65, 56, 47, 35],
    overflowStridePct: 4,
  },
  [ETrace.YELLOW]: {
    xPct: 50,
    yPctBottomToTop: [86, 75, 65, 56, 47, 35],
    overflowStridePct: 4,
  },
  [ETrace.BLUE]: {
    xPct: 81,
    yPctBottomToTop: [86, 75, 65, 56, 47, 35],
    overflowStridePct: 4,
  },
};

interface IOumuamuaBoardArtProps {
  alienIndex: number;
  board: IPublicOumuamuaBoard;
  playerColors: Record<string, string>;
}

export function OumuamuaBoardArt({
  alienIndex,
  board,
  playerColors,
}: IOumuamuaBoardArtProps): React.JSX.Element {
  return (
    <section
      className='min-w-0'
      data-testid={`alien-${alienIndex}-oumuamua-board`}
    >
      <AlienBoardArtFrame
        artKey='oumuamua'
        alt='Oumuamua alien board'
        testId={`alien-${alienIndex}-oumuamua-art`}
      >
        <TraceMarkerOverlay
          alienIndex={alienIndex}
          alienKey='oumuamua'
          traceSlots={board.traceSlots}
          playerColors={playerColors}
          layouts={OUMUAMUA_LAYOUTS}
        />
      </AlienBoardArtFrame>
    </section>
  );
}
