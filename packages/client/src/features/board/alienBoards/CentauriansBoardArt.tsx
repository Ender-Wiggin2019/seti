import { ETrace } from '@/types/re-exports';
import type { IPublicCentauriansBoard } from '@/types/re-exports';
import { AlienBoardArtFrame } from './AlienBoardArtFrame';
import {
  type TTraceColumnLayouts,
  TraceMarkerOverlay,
} from './TraceMarkerOverlay';

const CENTAURIANS_LAYOUTS: TTraceColumnLayouts = {
  [ETrace.RED]: { xPct: 18, yPctBottomToTop: [88, 76, 64, 52, 38, 25] },
  [ETrace.YELLOW]: { xPct: 50, yPctBottomToTop: [88, 76, 64, 52, 38, 25] },
  [ETrace.BLUE]: { xPct: 82, yPctBottomToTop: [88, 76, 64, 52, 38, 25] },
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
