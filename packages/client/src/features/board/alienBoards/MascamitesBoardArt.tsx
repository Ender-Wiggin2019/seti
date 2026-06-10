import { useTranslation } from 'react-i18next';
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
    xPctBottomToTop: [79.4, 79.1, 79.2, 79.8, 79.8, 66.2, 50.6, 64.5, 79.4],
    yPctBottomToTop: [92, 79.5, 68, 59.8, 52.6, 46.6, 41, 37.3, 32.4],
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
  const { t } = useTranslation('common');
  return (
    <section
      className='min-w-0'
      data-testid={`alien-${alienIndex}-mascamites-board`}
    >
      <AlienBoardArtFrame
        artKey='mascamites'
        alt={t('client.alien_board_extra.image_alt_named', {
          name: t('client.alien_board.types.mascamites', {
            defaultValue: 'Mascamites',
          }),
          defaultValue: 'Mascamites alien board',
        })}
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
