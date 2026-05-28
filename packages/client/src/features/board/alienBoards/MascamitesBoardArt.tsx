import type { IPublicMascamitesBoard } from '@/types/re-exports';
import { ETrace } from '@/types/re-exports';
import { AlienBoardArtFrame } from './AlienBoardArtFrame';
import {
  TraceMarkerOverlay,
  type TTraceColumnLayouts,
} from './TraceMarkerOverlay';

// Mascamites has normal pink/yellow trace ladders plus a larger blue sample
// path. Delivered samples become one-use blue trace slots, so the blue layout
// includes the printed sample positions in addition to the lower reward ladder.
// The shared layout field is named `yPctBottomToTop`; for Mascamites blue this
// is the delivered-sample slot order along the printed path.
const MASCAMITES_LAYOUTS: TTraceColumnLayouts = {
  [ETrace.PINK]: { xPct: 17, yPctBottomToTop: [83, 74, 65, 55] },
  [ETrace.YELLOW]: { xPct: 50, yPctBottomToTop: [83, 74, 65, 55] },
  [ETrace.BLUE]: {
    xPct: 79.4,
    xPctBottomToTop: [79.4, 64.5, 50.6, 66.2, 79.8, 79.8, 79.2, 79.1, 79.4],
    yPctBottomToTop: [32.4, 37.3, 41, 46.6, 52.6, 59.8, 68, 79.5, 92],
  },
};

interface IMascamitesBoardArtProps {
  alienIndex: number;
  board: IPublicMascamitesBoard;
  playerColors: Record<string, string>;
  selectableSlotIds?: ReadonlySet<string>;
  onSelectTraceSlot?: (slotId: string) => void;
}

export function MascamitesBoardArt({
  alienIndex,
  board,
  playerColors,
  selectableSlotIds,
  onSelectTraceSlot,
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
          selectableSlotIds={selectableSlotIds}
          onSelectTraceSlot={onSelectTraceSlot}
        />
      </AlienBoardArtFrame>
    </section>
  );
}
