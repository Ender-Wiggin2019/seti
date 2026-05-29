import { useTranslation } from 'react-i18next';
import type { IPublicExertiansBoard } from '@/types/re-exports';
import { ETrace } from '@/types/re-exports';
import { AlienBoardArtFrame } from './AlienBoardArtFrame';
import {
  TraceMarkerOverlay,
  type TTraceColumnLayouts,
} from './TraceMarkerOverlay';

const EXERTIANS_LAYOUTS: TTraceColumnLayouts = {
  [ETrace.PINK]: {
    xPct: 18,
    yPctBottomToTop: [78, 66, 53, 40, 27],
    hotspotIdIndexOffset: 1,
  },
  [ETrace.YELLOW]: {
    xPct: 50,
    yPctBottomToTop: [78, 66, 53, 40, 27],
    hotspotIdIndexOffset: 1,
  },
  [ETrace.BLUE]: {
    xPct: 82,
    yPctBottomToTop: [78, 66, 53, 40, 27],
    hotspotIdIndexOffset: 1,
  },
};

interface IExertiansBoardArtProps {
  alienIndex: number;
  board: IPublicExertiansBoard;
  playerColors: Record<string, string>;
  selectableSlotIds?: ReadonlySet<string>;
  onSelectTraceSlot?: (slotId: string) => void;
}

export function ExertiansBoardArt({
  alienIndex,
  board,
  playerColors,
  selectableSlotIds,
  onSelectTraceSlot,
}: IExertiansBoardArtProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section
      className='min-w-0'
      data-testid={`alien-${alienIndex}-exertians-board`}
    >
      <AlienBoardArtFrame
        artKey='exertians'
        alt={t('client.alien_board_extra.image_alt_named', {
          name: t('client.alien_board.types.exertians', {
            defaultValue: 'Exertians',
          }),
          defaultValue: 'Exertians alien board',
        })}
        testId={`alien-${alienIndex}-exertians-art`}
      >
        <TraceMarkerOverlay
          alienIndex={alienIndex}
          alienKey='exertians'
          traceSlots={board.traceSlots}
          playerColors={playerColors}
          layouts={EXERTIANS_LAYOUTS}
          selectableSlotIds={selectableSlotIds}
          onSelectTraceSlot={onSelectTraceSlot}
        />
      </AlienBoardArtFrame>
    </section>
  );
}
