import { useTranslation } from 'react-i18next';
import { HotspotAnchor } from '@/features/hotspots/HotspotAnchor';
import type {
  IPublicCentauriansBoard,
  IPublicPlayerState,
} from '@/types/re-exports';
import { ETrace } from '@/types/re-exports';
import { AlienBoardArtFrame } from './AlienBoardArtFrame';
import { CentauriansMessagesPanel } from './CentauriansMessagesPanel';
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
const ALIEN_BOARD_BASE_WIDTH = 777;
const ALIEN_BOARD_BASE_HEIGHT = 1415;

const CENTAURIANS_MESSAGE_ANCHORS = [
  {
    id: 'any-trace',
    label: 'Centaurians message any trace',
    x: 230,
    y: 132,
  },
  {
    id: 'energy-and-alien-card',
    label: 'Centaurians message energy and alien card',
    x: 343,
    y: 132,
  },
  {
    id: 'publicity-3',
    label: 'Centaurians message publicity 3',
    x: 457,
    y: 132,
  },
  {
    id: 'score-8',
    label: 'Centaurians message score 8',
    x: 570,
    y: 132,
  },
] as const;

interface ICentauriansBoardArtProps {
  alienIndex: number;
  board: IPublicCentauriansBoard;
  playerColors: Record<string, string>;
  players: IPublicPlayerState[];
  myPlayerId?: string;
  selectableSlotIds?: ReadonlySet<string>;
  onSelectTraceSlot?: (slotId: string) => void;
}

export function CentauriansBoardArt({
  alienIndex,
  board,
  playerColors,
  players,
  myPlayerId,
  selectableSlotIds,
  onSelectTraceSlot,
}: ICentauriansBoardArtProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section
      className='min-w-0 space-y-2'
      data-testid={`alien-${alienIndex}-centaurians-board`}
    >
      <AlienBoardArtFrame
        artKey='centaurians'
        alt={t('client.alien_board_extra.image_alt_named', {
          name: t('client.alien_board.types.centaurians', {
            defaultValue: 'Centaurians',
          }),
          defaultValue: 'Centaurians alien board',
        })}
        testId={`alien-${alienIndex}-centaurians-art`}
      >
        <TraceMarkerOverlay
          alienIndex={alienIndex}
          alienKey='centaurians'
          traceSlots={board.traceSlots}
          playerColors={playerColors}
          layouts={CENTAURIANS_LAYOUTS}
          selectableSlotIds={selectableSlotIds}
          onSelectTraceSlot={onSelectTraceSlot}
        />
        {CENTAURIANS_MESSAGE_ANCHORS.map((anchor) => (
          <HotspotAnchor
            key={anchor.id}
            sceneId='alien-board'
            hotspotId={`centaurians-${alienIndex}-message-${anchor.id}`}
            variant='image'
            baseWidth={ALIEN_BOARD_BASE_WIDTH}
            baseHeight={ALIEN_BOARD_BASE_HEIGHT}
            x={anchor.x}
            y={anchor.y}
            width={98}
            height={142}
            shape='rect'
            color='#6ee7b7'
            opacity={0.2}
            debugLabel={anchor.label}
            testId={`alien-${alienIndex}-centaurians-message-anchor-${anchor.id}`}
          />
        ))}
      </AlienBoardArtFrame>
      <CentauriansMessagesPanel
        alienIndex={alienIndex}
        board={board}
        players={players}
        myPlayerId={myPlayerId}
        playerColors={playerColors}
      />
    </section>
  );
}
