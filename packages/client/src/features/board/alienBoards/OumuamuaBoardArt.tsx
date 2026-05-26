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

interface IOumuamuaBoardArtProps {
  alienIndex: number;
  board: IPublicOumuamuaBoard;
  playerColors: Record<string, string>;
  planetActionMode?: EMainAction.ORBIT | EMainAction.LAND | null;
  orbitSelectable?: boolean;
  landSelectable?: boolean;
  onSelectMainActionPlanet?: (planet: EPlanet) => void;
}

export function OumuamuaBoardArt({
  alienIndex,
  board,
  playerColors,
  planetActionMode,
  orbitSelectable = false,
  landSelectable = false,
  onSelectMainActionPlanet,
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
        {planetActionMode === EMainAction.ORBIT ? (
          <HotspotButton
            sceneId='alien-board'
            hotspotId={`oumuamua-${alienIndex}-orbit`}
            baseWidth={777}
            baseHeight={1415}
            x={388.5}
            y={1080}
            width={280}
            height={96}
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
            hotspotId={`oumuamua-${alienIndex}-land`}
            baseWidth={777}
            baseHeight={1415}
            x={388.5}
            y={1190}
            width={280}
            height={96}
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
