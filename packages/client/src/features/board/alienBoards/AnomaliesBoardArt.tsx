import {
  TRACE_COLUMN_COLORS,
  type TTraceColumnColor,
} from '@seti/common/utils/alienTracePresentation';
import { HotspotAnchor } from '@/features/hotspots/HotspotAnchor';
import { HotspotButton } from '@/features/hotspots/HotspotButton';
import {
  useCalibrationMode,
  usePreviewOverflowCount,
} from '@/hooks/useCalibrationMode';
import type {
  IPublicAnomaliesBoard,
  IPublicTraceSlot,
} from '@/types/re-exports';
import { ETrace } from '@/types/re-exports';
import { AlienBoardArtFrame } from './AlienBoardArtFrame';
import { formatTraceSlotDebugInfo } from './TraceMarkerOverlay';

type TTraceOccupant = IPublicTraceSlot['occupants'][number];

const TRACE_RING_COLOR: Record<TTraceColumnColor, string> = {
  [ETrace.PINK]: '#d63384',
  [ETrace.YELLOW]: '#f5c242',
  [ETrace.BLUE]: '#3478d8',
};

const TRACE_LETTER: Record<TTraceColumnColor, string> = {
  [ETrace.PINK]: 'R',
  [ETrace.YELLOW]: 'Y',
  [ETrace.BLUE]: 'B',
};

/**
 * Distinct fallback colours for `?previewOverflow=N` synth occupants
 * whose `playerId` isn't in the live `playerColors` map. Mirrors the
 * 4-player palette so previews look like a real game in progress.
 */
const PREVIEW_PLAYER_FALLBACK_COLORS: Record<string, string> = {
  'preview-A': '#ef4444',
  'preview-B': '#3b82f6',
  'preview-C': '#22c55e',
  'preview-D': '#eab308',
};
const ALIEN_BOARD_BASE_WIDTH = 777;
const ALIEN_BOARD_BASE_HEIGHT = 1415;
const TRACE_MARKER_SIZE = (ALIEN_BOARD_BASE_WIDTH * 8) / 100;
const TRACE_SLOT_ANCHOR_SIZE = 108.00424713134765;

interface IAnomaliesColumnLayout {
  xPct: number;
  /**
   * Y centres of the 4 single-capacity printed circles, ordered bottom→top.
   * Bottom slot fills first; the 5th+ occupants go to the overflow circle.
   */
  singleCapYPctBottomToTop: [number, number, number, number];
  /** Y centre of the printed overflow circle at the column top. */
  overflowYPct: number;
  /**
   * Vertical stride in % of board height used to stack multiple overflow
   * occupants. Each subsequent overflow token shifts upward by this amount.
   */
  overflowStridePct: number;
}

// Anchor coordinates calibrated against the hi-res Anomalies board art
// (777x1415). Outer columns (Pink/Blue) print at the same Y; the middle
// (Yellow) column is staggered downward by ~5% (its circles sit just under
// where the outer-column circles do). Use `?calibrate=1` on the game
// page + the `/tmp/try-layout.mjs` overlay tool when tuning.
const ANOMALIES_LAYOUTS: Record<TTraceColumnColor, IAnomaliesColumnLayout> = {
  [ETrace.PINK]: {
    xPct: 18.3,
    singleCapYPctBottomToTop: [84.2, 73.1, 62, 50.9],
    overflowYPct: 38,
    overflowStridePct: 1.5,
  },
  [ETrace.YELLOW]: {
    xPct: 49.45,
    singleCapYPctBottomToTop: [89.2, 78.1, 67, 55.9],
    overflowYPct: 43,
    overflowStridePct: 1.5,
  },
  [ETrace.BLUE]: {
    xPct: 80.6,
    singleCapYPctBottomToTop: [84.2, 73.1, 62, 50.9],
    overflowYPct: 38,
    overflowStridePct: 1.5,
  },
};

interface IAnomaliesBoardArtProps {
  alienIndex: number;
  board: IPublicAnomaliesBoard;
  playerColors: Record<string, string>;
  selectableSlotIds?: ReadonlySet<string>;
  onSelectTraceSlot?: (slotId: string) => void;
}

export function AnomaliesBoardArt({
  alienIndex,
  board,
  playerColors,
  selectableSlotIds,
  onSelectTraceSlot,
}: IAnomaliesBoardArtProps): React.JSX.Element {
  const calibrate = useCalibrationMode();
  const previewOverflow = usePreviewOverflowCount();
  return (
    <section
      className='min-w-0'
      data-testid={`alien-${alienIndex}-anomalies-board`}
    >
      <AlienBoardArtFrame
        artKey='anomalies'
        alt='Anomalies alien board'
        testId={`alien-${alienIndex}-anomalies-art`}
      >
        {calibrate ? (
          <CalibrationOverlay alienIndex={alienIndex} />
        ) : (
          TRACE_COLUMN_COLORS.map((color) => {
            const tierSlots = board.traceBoard.columns[color] ?? [];
            // Build a (tierIndex, occupant) list. Tiers 0..3 are single-cap
            // circles; tier 4 is the overflow circle (any number of tokens).
            const liveOccupants: ITieredOccupant[] = tierSlots.flatMap(
              (slot, tierIndex) =>
                slot.occupants.map((occ) => ({ occ, tierIndex })),
            );
            const occupants =
              previewOverflow > 0
                ? buildPreviewOccupants(liveOccupants, previewOverflow)
                : liveOccupants;
            return (
              <div key={color}>
                <ColumnSlotAnchors
                  alienIndex={alienIndex}
                  color={color}
                  slots={tierSlots}
                  selectableSlotIds={selectableSlotIds}
                  onSelectTraceSlot={onSelectTraceSlot}
                />
                {occupants.length > 0 ? (
                  <ColumnMarkers
                    alienIndex={alienIndex}
                    color={color}
                    occupants={occupants}
                    playerColors={playerColors}
                  />
                ) : null}
              </div>
            );
          })
        )}
      </AlienBoardArtFrame>
    </section>
  );
}

function ColumnSlotAnchors({
  alienIndex,
  color,
  slots,
  selectableSlotIds,
  onSelectTraceSlot,
}: {
  alienIndex: number;
  color: TTraceColumnColor;
  slots: IPublicTraceSlot[];
  selectableSlotIds?: ReadonlySet<string>;
  onSelectTraceSlot?: (slotId: string) => void;
}): React.JSX.Element {
  const layout = ANOMALIES_LAYOUTS[color];
  const yPositions = [...layout.singleCapYPctBottomToTop, layout.overflowYPct];
  return (
    <>
      {yPositions.map((yPct, index) => {
        const x = (ALIEN_BOARD_BASE_WIDTH * layout.xPct) / 100;
        const y = (ALIEN_BOARD_BASE_HEIGHT * yPct) / 100;
        const slot = slots[index];
        const selectable =
          slot !== undefined && selectableSlotIds?.has(slot.slotId) === true;
        return (
          <span key={`${color}-${index}`}>
            <HotspotAnchor
              sceneId='alien-board'
              hotspotId={`anomalies-${alienIndex}-${color}-slot-${index}`}
              variant='image'
              baseWidth={ALIEN_BOARD_BASE_WIDTH}
              baseHeight={ALIEN_BOARD_BASE_HEIGHT}
              x={x}
              y={y}
              width={TRACE_SLOT_ANCHOR_SIZE}
              height={TRACE_SLOT_ANCHOR_SIZE}
              color={TRACE_RING_COLOR[color]}
              debugLabel={`anomalies ${color} slot ${index + 1}`}
              debugInfo={formatTraceSlotDebugInfo(slot)}
              className='rounded-full'
              testId={`alien-${alienIndex}-anomalies-slot-${color}-${index}`}
            />
            {selectable ? (
              <HotspotButton
                sceneId='alien-board'
                hotspotId={slot.slotId}
                variant='image'
                baseWidth={ALIEN_BOARD_BASE_WIDTH}
                baseHeight={ALIEN_BOARD_BASE_HEIGHT}
                x={x}
                y={y}
                width={TRACE_SLOT_ANCHOR_SIZE}
                height={TRACE_SLOT_ANCHOR_SIZE}
                color={TRACE_RING_COLOR[color]}
                debugLabel={`anomalies ${color} trace option ${index + 1}`}
                debugInfo={formatTraceSlotDebugInfo(slot)}
                ariaLabel={`Select anomalies ${color} trace slot ${index + 1}`}
                className='rounded-full border-accent-400/70'
                testId={`alien-${alienIndex}-anomalies-hotspot-${color}-${index}`}
                onClick={() => onSelectTraceSlot?.(slot.slotId)}
              />
            ) : null}
          </span>
        );
      })}
    </>
  );
}

interface ITieredOccupant {
  occ: TTraceOccupant;
  /** 0..3 = single-cap tier (bottom→top); 4 = overflow tier. */
  tierIndex: number;
}

const PREVIEW_PLAYER_IDS = ['preview-A', 'preview-B', 'preview-C', 'preview-D'];

/**
 * Build a synthesized occupant list for the `?previewOverflow=N` debug flag:
 *   - 4 single-cap occupants spread across tiers 0..3 (one per tier)
 *   - N additional overflow occupants on tier 4
 * Live occupants always take priority; only the gap up to 4 + N is filled.
 */
function buildPreviewOccupants(
  live: ReadonlyArray<ITieredOccupant>,
  overflowCount: number,
): ITieredOccupant[] {
  const out: ITieredOccupant[] = [...live];
  // Track which single-cap tiers are filled so we don't double up.
  const filledTiers = new Set(
    live.filter((entry) => entry.tierIndex < 4).map((entry) => entry.tierIndex),
  );
  let preview = 0;
  for (let tier = 0; tier < 4; tier += 1) {
    if (filledTiers.has(tier)) continue;
    const playerId =
      PREVIEW_PLAYER_IDS[preview % PREVIEW_PLAYER_IDS.length] ?? 'preview';
    out.push({
      occ: { source: { playerId }, traceColor: ETrace.PINK },
      tierIndex: tier,
    });
    preview += 1;
  }
  for (let i = 0; i < overflowCount; i += 1) {
    const playerId =
      PREVIEW_PLAYER_IDS[(preview + i) % PREVIEW_PLAYER_IDS.length] ??
      'preview';
    out.push({
      occ: { source: { playerId }, traceColor: ETrace.PINK },
      tierIndex: 4,
    });
  }
  return out;
}

function ColumnMarkers({
  alienIndex,
  color,
  occupants,
  playerColors,
}: {
  alienIndex: number;
  color: TTraceColumnColor;
  occupants: ReadonlyArray<ITieredOccupant>;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const layout = ANOMALIES_LAYOUTS[color];
  // Track how many overflow markers we've already placed so additional ones
  // stack upward inside the overflow circle.
  let overflowOrder = 0;
  return (
    <div
      data-testid={`alien-${alienIndex}-anomalies-column-${color}`}
      data-trace-color={color}
    >
      {occupants.map(({ occ, tierIndex }, index) => {
        const inOverflow = tierIndex >= 4;
        const xPct = layout.xPct;
        let yPct: number;
        if (inOverflow) {
          // First overflow token at centre, subsequent ones fan upward.
          yPct = layout.overflowYPct - overflowOrder * layout.overflowStridePct;
          overflowOrder += 1;
        } else {
          yPct =
            layout.singleCapYPctBottomToTop[tierIndex] ??
            layout.singleCapYPctBottomToTop[
              layout.singleCapYPctBottomToTop.length - 1
            ];
        }
        return (
          <SlotMarker
            key={`${color}-${index}`}
            hotspotId={`anomalies-${alienIndex}-${color}-${index}`}
            debugLabel={`anomalies ${color} trace ${index + 1}`}
            xPct={xPct}
            yPct={yPct}
            occupant={occ}
            playerColors={playerColors}
            testId={`alien-${alienIndex}-anomalies-marker-${color}-${index}`}
          />
        );
      })}
    </div>
  );
}

function SlotMarker({
  xPct,
  yPct,
  hotspotId,
  debugLabel,
  occupant,
  playerColors,
  testId,
}: {
  xPct: number;
  yPct: number;
  hotspotId: string;
  debugLabel: string;
  occupant: TTraceOccupant;
  playerColors: Record<string, string>;
  ringColor?: string;
  testId: string;
}): React.JSX.Element {
  const playerId =
    occupant.source === 'neutral' ? null : occupant.source.playerId;
  // Fall back to the preview-palette colour when the live `playerColors`
  // map doesn't know this player — happens for `?previewOverflow=N`
  // synth occupants whose ids are `preview-A/B/C/D`.
  const fill =
    playerId === null
      ? '#9ca3af'
      : (playerColors[playerId] ??
        PREVIEW_PLAYER_FALLBACK_COLORS[playerId] ??
        '#cbd5e1');
  return (
    <HotspotAnchor
      sceneId='alien-board'
      hotspotId={hotspotId}
      baseWidth={ALIEN_BOARD_BASE_WIDTH}
      baseHeight={ALIEN_BOARD_BASE_HEIGHT}
      x={(ALIEN_BOARD_BASE_WIDTH * xPct) / 100}
      y={(ALIEN_BOARD_BASE_HEIGHT * yPct) / 100}
      width={TRACE_MARKER_SIZE}
      height={TRACE_MARKER_SIZE}
      color={fill}
      debugLabel={debugLabel}
      debugInfo={playerId ?? 'neutral'}
      className='rounded-full'
      title={playerId ?? 'neutral'}
      testId={testId}
    >
      <span
        className='block h-full w-full rounded-full border border-black/50 shadow-[0_0_4px_rgba(0,0,0,0.6)]'
        style={{ backgroundColor: fill }}
      />
    </HotspotAnchor>
  );
}

function CalibrationOverlay({
  alienIndex,
}: {
  alienIndex: number;
}): React.JSX.Element {
  return (
    <>
      {TRACE_COLUMN_COLORS.map((color) => {
        const layout = ANOMALIES_LAYOUTS[color];
        const ringColor = TRACE_RING_COLOR[color];
        const letter = TRACE_LETTER[color];
        return (
          <div key={color} data-trace-color={color}>
            {layout.singleCapYPctBottomToTop.map((yPct, index) => (
              <span
                key={`${color}-${index}`}
                className='absolute flex aspect-square w-[10%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] font-mono text-[9px] font-bold'
                style={{
                  left: `${layout.xPct}%`,
                  top: `${yPct}%`,
                  borderColor: ringColor,
                  backgroundColor: 'rgba(0, 0, 0, 0.55)',
                  color: ringColor,
                }}
                data-testid={`calibrate-anomalies-${color}-${index}`}
                title={`anomalies ${letter}${index} (x=${layout.xPct}%, y=${yPct}%)`}
              >
                {letter}
                {index}
              </span>
            ))}
            <span
              className='absolute flex aspect-square w-[10%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] font-mono text-[9px] font-bold'
              style={{
                left: `${layout.xPct}%`,
                top: `${layout.overflowYPct}%`,
                borderColor: ringColor,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                color: ringColor,
              }}
              data-testid={`calibrate-anomalies-${color}-overflow`}
              title={`anomalies ${letter} overflow (x=${layout.xPct}%, y=${layout.overflowYPct}%)`}
            >
              {letter}∞
            </span>
          </div>
        );
      })}
      <span
        className='absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white'
        data-testid={`calibrate-anomalies-${alienIndex}-badge`}
      >
        cal · anomalies
      </span>
    </>
  );
}
