import { ETrace } from '@/types/re-exports';
import type { IPublicExertiansBoard } from '@/types/re-exports';
import { AlienBoardArtFrame } from './AlienBoardArtFrame';
import {
  type TTraceColumnLayouts,
  TraceMarkerOverlay,
} from './TraceMarkerOverlay';

const EXERTIANS_LAYOUTS: TTraceColumnLayouts = {
  [ETrace.RED]: { xPct: 18, yPctBottomToTop: [90, 78, 66, 53, 40, 27] },
  [ETrace.YELLOW]: { xPct: 50, yPctBottomToTop: [90, 78, 66, 53, 40, 27] },
  [ETrace.BLUE]: { xPct: 82, yPctBottomToTop: [90, 78, 66, 53, 40, 27] },
};

interface IExertiansBoardArtProps {
  alienIndex: number;
  board: IPublicExertiansBoard;
  playerColors: Record<string, string>;
}

export function ExertiansBoardArt({
  alienIndex,
  board,
  playerColors,
}: IExertiansBoardArtProps): React.JSX.Element {
  return (
    <section
      className='min-w-0'
      data-testid={`alien-${alienIndex}-exertians-board`}
    >
      <AlienBoardArtFrame
        artKey='exertians'
        alt='Exertians alien board'
        testId={`alien-${alienIndex}-exertians-art`}
      >
        <TraceMarkerOverlay
          alienIndex={alienIndex}
          alienKey='exertians'
          traceSlots={board.traceSlots}
          playerColors={playerColors}
          layouts={EXERTIANS_LAYOUTS}
        />
      </AlienBoardArtFrame>
    </section>
  );
}
