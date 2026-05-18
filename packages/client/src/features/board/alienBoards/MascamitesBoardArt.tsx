import { ETrace } from '@/types/re-exports';
import type { IPublicMascamitesBoard } from '@/types/re-exports';
import { AlienBoardArtFrame } from './AlienBoardArtFrame';
import {
  type TTraceColumnLayouts,
  TraceMarkerOverlay,
} from './TraceMarkerOverlay';

// Mascamites reference art has 3 trace columns at the bottom; the top half
// shows sample-capsule slots (rendered separately on top of the printed art).
const MASCAMITES_LAYOUTS: TTraceColumnLayouts = {
  [ETrace.RED]: { xPct: 17, yPctBottomToTop: [92, 83, 74, 65, 55] },
  [ETrace.YELLOW]: { xPct: 50, yPctBottomToTop: [92, 83, 74, 65, 55] },
  [ETrace.BLUE]: { xPct: 83, yPctBottomToTop: [92, 83, 74, 65, 55] },
};

interface IMascamitesBoardArtProps {
  alienIndex: number;
  board: IPublicMascamitesBoard;
  playerColors: Record<string, string>;
}

export function MascamitesBoardArt({
  alienIndex,
  board,
  playerColors,
}: IMascamitesBoardArtProps): React.JSX.Element {
  return (
    <section
      className='min-w-0'
      data-testid={`alien-${alienIndex}-mascamites-board`}
    >
      <AlienBoardArtFrame
        artKey='mascamites'
        alt='Mascamites alien board'
        testId={`alien-${alienIndex}-mascamites-art`}
      >
        <TraceMarkerOverlay
          alienIndex={alienIndex}
          alienKey='mascamites'
          traceSlots={board.traceSlots}
          playerColors={playerColors}
          layouts={MASCAMITES_LAYOUTS}
        />
      </AlienBoardArtFrame>
    </section>
  );
}
