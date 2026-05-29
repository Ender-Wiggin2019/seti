import { useTranslation } from 'react-i18next';
import { HotspotAnchor } from '@/features/hotspots/HotspotAnchor';
import { HotspotButton } from '@/features/hotspots/HotspotButton';
import type { IPublicOumuamuaBoard } from '@/types/re-exports';
import { EMainAction, EPlanet, ETrace } from '@/types/re-exports';
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
    xPct: 18.6,
    yPctBottomToTop: [83.9, 74, 64.2, 54.5, 43.5],
    overflowStridePct: 1.5,
  },
  [ETrace.YELLOW]: {
    xPct: 49.7,
    yPctBottomToTop: [88.8, 78.9, 69.2, 59.5, 48.5],
    overflowStridePct: 1.5,
  },
  [ETrace.BLUE]: {
    xPct: 81,
    yPctBottomToTop: [83.9, 74, 64.2, 54.5, 43.5],
    overflowStridePct: 1.5,
  },
};
const ALIEN_BOARD_BASE_WIDTH = 777;
const ALIEN_BOARD_BASE_HEIGHT = 1415;

const OUMUAMUA_PLANET_ANCHORS = [
  {
    id: 'orbit-area',
    label: 'Oumuamua orbit area',
    x: 104,
    y: 336,
    width: 150,
    height: 150,
  },
  {
    id: 'land-area',
    label: 'Oumuamua land area',
    x: 344,
    y: 390,
    width: 315,
    height: 300,
  },
  {
    id: 'first-land-data-1',
    label: 'Oumuamua first land data 1',
    x: 306,
    y: 308,
    width: 96,
    height: 96,
  },
  {
    id: 'first-land-data-2',
    label: 'Oumuamua first land data 2',
    x: 262,
    y: 402,
    width: 96,
    height: 96,
  },
  {
    id: 'first-land-data-3',
    label: 'Oumuamua first land data 3',
    x: 306,
    y: 496,
    width: 96,
    height: 96,
  },
] as const;

interface IOumuamuaBoardArtProps {
  alienIndex: number;
  board: IPublicOumuamuaBoard;
  playerColors: Record<string, string>;
  planetActionMode?: EMainAction.ORBIT | EMainAction.LAND | null;
  orbitSelectable?: boolean;
  landSelectable?: boolean;
  selectableSlotIds?: ReadonlySet<string>;
  onSelectTraceSlot?: (slotId: string) => void;
  onSelectMainActionPlanet?: (planet: EPlanet) => void;
}

export function OumuamuaBoardArt({
  alienIndex,
  board,
  playerColors,
  planetActionMode,
  orbitSelectable = false,
  landSelectable = false,
  selectableSlotIds,
  onSelectTraceSlot,
  onSelectMainActionPlanet,
}: IOumuamuaBoardArtProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section
      className='min-w-0'
      data-testid={`alien-${alienIndex}-oumuamua-board`}
    >
      <AlienBoardArtFrame
        artKey='oumuamua'
        alt={t('client.alien_board_extra.image_alt_named', {
          name: t('client.alien_board.types.oumuamua', {
            defaultValue: 'Oumuamua',
          }),
          defaultValue: 'Oumuamua alien board',
        })}
        testId={`alien-${alienIndex}-oumuamua-art`}
      >
        <TraceMarkerOverlay
          alienIndex={alienIndex}
          alienKey='oumuamua'
          traceSlots={board.traceSlots}
          playerColors={playerColors}
          layouts={OUMUAMUA_LAYOUTS}
          selectableSlotIds={selectableSlotIds}
          onSelectTraceSlot={onSelectTraceSlot}
        />
        {OUMUAMUA_PLANET_ANCHORS.map((anchor) => (
          <HotspotAnchor
            key={anchor.id}
            sceneId='alien-board'
            hotspotId={`oumuamua-${alienIndex}-${anchor.id}`}
            variant='image'
            baseWidth={ALIEN_BOARD_BASE_WIDTH}
            baseHeight={ALIEN_BOARD_BASE_HEIGHT}
            x={anchor.x}
            y={anchor.y}
            width={anchor.width}
            height={anchor.height}
            shape='rect'
            color='#a78bfa'
            opacity={0.22}
            debugLabel={anchor.label}
            testId={`alien-${alienIndex}-oumuamua-anchor-${anchor.id}`}
          />
        ))}
        {planetActionMode === EMainAction.ORBIT ? (
          <HotspotButton
            sceneId='alien-board'
            hotspotId={`oumuamua-${alienIndex}-orbit-area`}
            variant='image'
            baseWidth={ALIEN_BOARD_BASE_WIDTH}
            baseHeight={ALIEN_BOARD_BASE_HEIGHT}
            x={104}
            y={336}
            width={150}
            height={150}
            shape='rect'
            testId='planet-target-oumuamua'
            debugLabel='Oumuamua orbit'
            ariaLabel='Orbit Oumuamua'
            disabled={!orbitSelectable}
            onClick={() => onSelectMainActionPlanet?.(EPlanet.OUMUAMUA)}
            className='border-accent-400/70'
            opacity={0.36}
          />
        ) : null}
        {planetActionMode === EMainAction.LAND ? (
          <HotspotButton
            sceneId='alien-board'
            hotspotId={`oumuamua-${alienIndex}-land-area`}
            variant='image'
            baseWidth={ALIEN_BOARD_BASE_WIDTH}
            baseHeight={ALIEN_BOARD_BASE_HEIGHT}
            x={344}
            y={390}
            width={315}
            height={300}
            shape='rect'
            testId='planet-target-oumuamua'
            debugLabel='Oumuamua land'
            ariaLabel='Land Oumuamua'
            disabled={!landSelectable}
            onClick={() => onSelectMainActionPlanet?.(EPlanet.OUMUAMUA)}
            className='border-accent-400/70'
            opacity={0.36}
          />
        ) : null}
      </AlienBoardArtFrame>
    </section>
  );
}
