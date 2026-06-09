import {
  groupTraceSlotsByColor,
  TRACE_COLUMN_COLORS,
  type TTraceColumnColor,
} from '@seti/common/utils/alienTracePresentation';
import { useState } from 'react';
import { HotspotAnchor } from '@/features/hotspots/HotspotAnchor';
import { HotspotButton } from '@/features/hotspots/HotspotButton';
import {
  geometryToPercentStyle,
  getHotspotStorageSceneId,
  type IHotspotGeometry,
  resolveHotspotGeometry,
} from '@/features/hotspots/hotspotConfig';
import {
  useCalibrationMode,
  usePreviewOverflowCount,
} from '@/hooks/useCalibrationMode';
import { useDebugStore } from '@/stores/debugStore';
import { BOARD_LOCAL_Z_INDEX } from '@/styles/zIndex';
import type { IPublicTraceSlot } from '@/types/re-exports';
import { ETrace } from '@/types/re-exports';
import { decorateSlotWithPreviewOccupants } from './AlienBoardTraceGrid';

type TTraceOccupant = IPublicTraceSlot['occupants'][number];

const TRACE_COLOR: Record<TTraceColumnColor, string> = {
  [ETrace.PINK]: '#d63384',
  [ETrace.YELLOW]: '#f5c242',
  [ETrace.BLUE]: '#3478d8',
};

const TRACE_LETTER: Record<TTraceColumnColor, string> = {
  [ETrace.PINK]: 'R',
  [ETrace.YELLOW]: 'Y',
  [ETrace.BLUE]: 'B',
};
const ALIEN_BOARD_BASE_WIDTH = 777;
const ALIEN_BOARD_BASE_HEIGHT = 1415;
const TRACE_MARKER_SIZE = (ALIEN_BOARD_BASE_WIDTH * 8) / 100;
const TRACE_SLOT_ANCHOR_SIZE = 108.00424713134765;

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

export interface ITraceColumnLayout {
  /** Horizontal centre, in % of board width. */
  xPct: number;
  /**
   * Optional per-slot horizontal centres, ordered with `yPctBottomToTop`.
   * Used by boards like Mascamites where the blue sample trace path is not a
   * straight vertical column.
   */
  xPctBottomToTop?: number[];
  /**
   * Y centre of each printed slot, ordered from bottom-most to top-most.
   * Index N maps to the Nth slot of this colour as received from the server
   * (server inserts trace slots in tier order, so bottom-most VP-rich slot
   * comes first).
   */
  yPctBottomToTop: number[];
  /**
   * Offset used only for persisted hotspot ids. Some calibrated legacy anchors
   * start at 1 even though slot arrays remain zero-indexed.
   */
  hotspotIdIndexOffset?: number;
  /**
   * Vertical stride (in % of board height) used to stack multiple occupants
   * inside an overflow slot (`maxOccupants === -1`). Each subsequent occupant
   * shifts upward by this amount. Defaults to 1.5% — matches the
   * Anomalies image-mode overflow ladder, which reads as the visually
   * correct token density. Earlier the default was 4.5% which left
   * gaps between stacked tokens.
   */
  overflowStridePct?: number;
}

export type TTraceColumnLayouts = Record<TTraceColumnColor, ITraceColumnLayout>;

export function formatTraceSlotAnchorHotspotId({
  alienKey,
  alienIndex,
  color,
  slotIndex,
  layout,
}: {
  alienKey: string;
  alienIndex: number;
  color: TTraceColumnColor;
  slotIndex: number;
  layout: Pick<ITraceColumnLayout, 'hotspotIdIndexOffset'>;
}): string {
  return `${alienKey}-${alienIndex}-${color}-slot-${
    slotIndex + (layout.hotspotIdIndexOffset ?? 0)
  }`;
}

interface ITraceMarkerOverlayProps {
  alienIndex: number;
  alienKey: string;
  traceSlots: IPublicTraceSlot[];
  playerColors: Record<string, string>;
  layouts: TTraceColumnLayouts;
  selectableSlotIds?: ReadonlySet<string>;
  onSelectTraceSlot?: (slotId: string) => void;
}

/**
 * Overlay player markers onto an alien-board art frame using per-column layouts.
 *
 * Each colour column uses the per-slot Y positions from `layouts[color]`. A
 * single-capacity slot places its occupant at the slot centre; an overflow slot
 * (`maxOccupants === -1`) stacks occupants vertically using `overflowStridePct`.
 */
export function TraceMarkerOverlay({
  alienIndex,
  alienKey,
  traceSlots,
  playerColors,
  layouts,
  selectableSlotIds,
  onSelectTraceSlot,
}: ITraceMarkerOverlayProps): React.JSX.Element {
  const calibrate = useCalibrationMode();
  if (calibrate) {
    return (
      <CalibrationOverlay
        alienIndex={alienIndex}
        alienKey={alienKey}
        traceSlots={traceSlots}
        layouts={layouts}
      />
    );
  }
  const slotsByColor = groupTraceSlotsByColor(traceSlots);
  const previewOverflow = usePreviewOverflowCount();
  return (
    <>
      {TRACE_COLUMN_COLORS.map((color) => {
        const layout = layouts[color];
        const liveSlots = slotsByColor[color] ?? [];
        if (!layout) return null;
        const slots =
          previewOverflow > 0
            ? liveSlots.map((slot) =>
                decorateSlotWithPreviewOccupants(slot, color, previewOverflow),
              )
            : liveSlots;
        const stride = layout.overflowStridePct ?? 1.5;
        return (
          <div
            key={color}
            data-testid={`alien-${alienIndex}-${alienKey}-column-${color}`}
            data-trace-color={color}
          >
            <TraceSlotAnchors
              alienIndex={alienIndex}
              alienKey={alienKey}
              color={color}
              slots={liveSlots}
              layout={layout}
              selectableSlotIds={selectableSlotIds}
              onSelectTraceSlot={onSelectTraceSlot}
            />
            {slots.map((slot, slotIndex) => {
              const yPct =
                layout.yPctBottomToTop[slotIndex] ??
                layout.yPctBottomToTop[layout.yPctBottomToTop.length - 1];
              if (yPct === undefined) return null;
              const xPct = layout.xPctBottomToTop?.[slotIndex] ?? layout.xPct;
              const slotAnchorX = (ALIEN_BOARD_BASE_WIDTH * xPct) / 100;
              const slotAnchorY = (ALIEN_BOARD_BASE_HEIGHT * yPct) / 100;
              const slotAnchorHotspotId = formatTraceSlotAnchorHotspotId({
                alienKey,
                alienIndex,
                color,
                slotIndex,
                layout,
              });
              const isOverflow = slot.maxOccupants === -1;
              return slot.occupants.map((occ, occIndex) => {
                // Single-cap slot: stay centered. Overflow: stack upward.
                const markerOffsetY = isOverflow
                  ? -((ALIEN_BOARD_BASE_HEIGHT * stride * occIndex) / 100)
                  : 0;
                return (
                  <SlotMarker
                    key={`${slot.slotId}-${occIndex}`}
                    hotspotId={`${alienKey}-${alienIndex}-${color}-${slotIndex}-${occIndex}`}
                    slotAnchorHotspotId={slotAnchorHotspotId}
                    debugLabel={`${alienKey} ${color} trace ${slotIndex + 1}${
                      occIndex > 0 ? `.${occIndex + 1}` : ''
                    }`}
                    slotAnchorX={slotAnchorX}
                    slotAnchorY={slotAnchorY}
                    markerOffsetY={markerOffsetY}
                    occupant={occ}
                    playerColors={playerColors}
                    testId={`alien-${alienIndex}-${alienKey}-marker-${color}-${slotIndex}-${occIndex}`}
                  />
                );
              });
            })}
          </div>
        );
      })}
    </>
  );
}

function TraceSlotAnchors({
  alienIndex,
  alienKey,
  color,
  slots,
  layout,
  selectableSlotIds,
  onSelectTraceSlot,
}: {
  alienIndex: number;
  alienKey: string;
  color: TTraceColumnColor;
  slots: IPublicTraceSlot[];
  layout: ITraceColumnLayout;
  selectableSlotIds?: ReadonlySet<string>;
  onSelectTraceSlot?: (slotId: string) => void;
}): React.JSX.Element {
  return (
    <>
      {layout.yPctBottomToTop.map((yPct, index) => {
        const x =
          (ALIEN_BOARD_BASE_WIDTH *
            (layout.xPctBottomToTop?.[index] ?? layout.xPct)) /
          100;
        const y = (ALIEN_BOARD_BASE_HEIGHT * yPct) / 100;
        const slot = slots[index];
        const anchorHotspotId = formatTraceSlotAnchorHotspotId({
          alienKey,
          alienIndex,
          color,
          slotIndex: index,
          layout,
        });
        const selectable =
          slot !== undefined && selectableSlotIds?.has(slot.slotId) === true;
        return (
          <span key={`${color}-${index}`}>
            <HotspotAnchor
              sceneId='alien-board'
              hotspotId={anchorHotspotId}
              variant='image'
              baseWidth={ALIEN_BOARD_BASE_WIDTH}
              baseHeight={ALIEN_BOARD_BASE_HEIGHT}
              x={x}
              y={y}
              width={TRACE_SLOT_ANCHOR_SIZE}
              height={TRACE_SLOT_ANCHOR_SIZE}
              color={TRACE_COLOR[color]}
              debugLabel={`${alienKey} ${color} slot ${index + 1}`}
              debugInfo={formatTraceSlotDebugInfo(slot)}
              className='rounded-full'
              testId={`alien-${alienIndex}-${alienKey}-slot-${color}-${index}`}
            />
            {selectable ? (
              <HotspotButton
                sceneId='alien-board'
                hotspotId={anchorHotspotId}
                variant='image'
                baseWidth={ALIEN_BOARD_BASE_WIDTH}
                baseHeight={ALIEN_BOARD_BASE_HEIGHT}
                x={x}
                y={y}
                width={TRACE_SLOT_ANCHOR_SIZE}
                height={TRACE_SLOT_ANCHOR_SIZE}
                color={TRACE_COLOR[color]}
                debugLabel={`${alienKey} ${color} trace option ${index + 1}`}
                debugInfo={formatTraceSlotDebugInfo(slot)}
                ariaLabel={`Select ${alienKey} ${color} trace slot ${index + 1}`}
                attention
                className='rounded-full border-accent-400/70'
                testId={`alien-${alienIndex}-${alienKey}-hotspot-${color}-${index}`}
                dataAttributes={{ 'data-server-trace-slot-id': slot.slotId }}
                onClick={() => onSelectTraceSlot?.(slot.slotId)}
              />
            ) : null}
          </span>
        );
      })}
    </>
  );
}

function CalibrationOverlay({
  alienIndex,
  alienKey,
  traceSlots,
  layouts,
}: {
  alienIndex: number;
  alienKey: string;
  traceSlots: IPublicTraceSlot[];
  layouts: TTraceColumnLayouts;
}): React.JSX.Element {
  const slotsByColor = groupTraceSlotsByColor(traceSlots);
  return (
    <>
      {TRACE_COLUMN_COLORS.map((color) => {
        const layout = layouts[color];
        if (!layout) return null;
        const slots = slotsByColor[color] ?? [];
        const ringColor = TRACE_COLOR[color];
        const letter = TRACE_LETTER[color];
        return (
          <div key={color} data-trace-color={color}>
            {layout.yPctBottomToTop.map((yPct, index) => {
              const slot = slots[index];
              const isOverflow = slot?.maxOccupants === -1;
              const xPct = layout.xPctBottomToTop?.[index] ?? layout.xPct;
              return (
                <span
                  key={`${color}-${index}`}
                  className='absolute flex aspect-square w-[10%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] font-mono text-[9px] font-bold'
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                    borderColor: ringColor,
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    color: ringColor,
                  }}
                  data-testid={`calibrate-${alienKey}-${color}-${index}`}
                  title={`${alienKey} ${letter}${index}${
                    isOverflow ? ' (overflow)' : ''
                  } (x=${xPct}%, y=${yPct}%)`}
                >
                  {letter}
                  {index}
                  {isOverflow ? '*' : ''}
                </span>
              );
            })}
          </div>
        );
      })}
      <span
        className='absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white'
        data-testid={`calibrate-${alienKey}-${alienIndex}-badge`}
      >
        cal · {alienKey}
      </span>
    </>
  );
}

function SlotMarker({
  hotspotId,
  slotAnchorHotspotId,
  debugLabel,
  slotAnchorX,
  slotAnchorY,
  markerOffsetY = 0,
  occupant,
  playerColors,
  testId,
}: {
  hotspotId: string;
  slotAnchorHotspotId: string;
  debugLabel: string;
  slotAnchorX: number;
  slotAnchorY: number;
  markerOffsetY?: number;
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
    <TraceSlotMarkerAnchor
      hotspotId={hotspotId}
      slotAnchorHotspotId={slotAnchorHotspotId}
      slotAnchorX={slotAnchorX}
      slotAnchorY={slotAnchorY}
      markerOffsetY={markerOffsetY}
      color={fill}
      debugLabel={debugLabel}
      debugInfo={playerId ?? 'neutral'}
      title={playerId ?? 'neutral'}
      testId={testId}
    >
      <span
        className='block h-full w-full rounded-full border border-black/50 shadow-[0_0_4px_rgba(0,0,0,0.6)]'
        style={{ backgroundColor: fill }}
      />
    </TraceSlotMarkerAnchor>
  );
}

export function TraceSlotMarkerAnchor({
  hotspotId,
  slotAnchorHotspotId,
  slotAnchorX,
  slotAnchorY,
  markerOffsetX = 0,
  markerOffsetY = 0,
  color,
  debugLabel,
  debugInfo,
  title,
  testId,
  children,
}: React.PropsWithChildren<{
  hotspotId: string;
  slotAnchorHotspotId: string;
  slotAnchorX: number;
  slotAnchorY: number;
  markerOffsetX?: number;
  markerOffsetY?: number;
  color: string;
  debugLabel: string;
  debugInfo?: React.ReactNode;
  title?: string;
  testId: string;
}>): React.JSX.Element {
  const debug = useDebugStore((state) => state.hotspotDebug);
  const showAnchorHotspots = useDebugStore((state) => state.showAnchorHotspots);
  const storageSceneId = getHotspotStorageSceneId('alien-board', 'image');
  const committedOverride = useDebugStore(
    (state) => state.hotspotOverrides[storageSceneId]?.[slotAnchorHotspotId],
  );
  const draftOverride = useDebugStore(
    (state) =>
      state.hotspotDraftOverrides[storageSceneId]?.[slotAnchorHotspotId],
  );
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const slotGeometry = resolveHotspotGeometry(
    {
      x: slotAnchorX,
      y: slotAnchorY,
      width: TRACE_SLOT_ANCHOR_SIZE,
      height: TRACE_SLOT_ANCHOR_SIZE,
    },
    draftOverride === undefined
      ? committedOverride
      : { ...(committedOverride ?? {}), ...draftOverride },
  );
  const markerGeometry: IHotspotGeometry = {
    x: slotGeometry.x + markerOffsetX,
    y: slotGeometry.y + markerOffsetY,
    width: TRACE_MARKER_SIZE,
    height: TRACE_MARKER_SIZE,
  };
  const debugVisible = debug && showAnchorHotspots;

  return (
    <div
      data-hotspot-scene='alien-board'
      data-hotspot-id={hotspotId}
      data-hotspot-variant='image'
      data-hotspot-role='anchor'
      data-trace-anchor-hotspot-id={slotAnchorHotspotId}
      data-testid={testId}
      title={title ?? debugLabel}
      tabIndex={debugVisible ? 0 : undefined}
      className={`absolute rounded-full border transition-[background-color,border-color,opacity,box-shadow] ${
        debugVisible
          ? 'pointer-events-auto cursor-default border-current shadow-[0_0_0_1px_rgba(0,0,0,0.45)]'
          : 'pointer-events-none border-transparent'
      }`}
      style={{
        ...geometryToPercentStyle(
          markerGeometry,
          ALIEN_BOARD_BASE_WIDTH,
          ALIEN_BOARD_BASE_HEIGHT,
        ),
        zIndex: BOARD_LOCAL_Z_INDEX.hotspot,
        minWidth: '24px',
        minHeight: '24px',
        color,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseEnter={() => setShowDebugInfo(true)}
      onMouseLeave={() => setShowDebugInfo(false)}
      onFocus={() => setShowDebugInfo(true)}
      onBlur={() => setShowDebugInfo(false)}
    >
      {children}
      {debugVisible && showDebugInfo ? (
        <span
          className='pointer-events-none absolute left-full top-1/2 z-20 ml-1 grid max-w-[220px] -translate-y-1/2 gap-0.5 rounded-sm border border-surface-950/80 bg-surface-950/95 px-1.5 py-1 font-mono text-[9px] leading-tight text-text-100 shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
          data-testid={`hotspot-anchor-info-alien-board-${hotspotId}`}
        >
          <span className='uppercase'>{debugLabel}</span>
          {debugInfo ? (
            <span className='whitespace-normal text-text-300'>{debugInfo}</span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

export function formatTraceSlotDebugInfo(
  slot: IPublicTraceSlot | undefined,
): string {
  if (!slot) {
    return 'No server trace slot';
  }
  if (slot.rewards.length === 0) {
    return `Trace bonus: none (${slot.slotId})`;
  }
  return `Trace bonus: ${slot.rewards.map(formatTraceReward).join(' + ')}`;
}

function formatTraceReward(
  reward: IPublicTraceSlot['rewards'][number],
): string {
  switch (reward.type) {
    case 'VP':
      return `${reward.amount} VP`;
    case 'CARD_ANY':
      return `${reward.amount} any card`;
    case 'CARD':
      return `${reward.amount} card`;
    case 'CREDIT':
      return `${reward.amount} credit`;
    case 'ENERGY':
      return `${reward.amount} energy`;
    case 'DATA':
      return `${reward.amount} data`;
    case 'PUBLICITY':
      return `${reward.amount} publicity`;
    case 'CUSTOM':
      return reward.effectId;
  }
}
