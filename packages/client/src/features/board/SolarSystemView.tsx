import { DescRender } from '@seti/cards';
import { OUMUAMUA_TILE_DATA_CAPACITY } from '@seti/common/constant/alienBoardConfig';
import type {
  ISolarSystemSetupConfig,
  TSolarSystemWheelIndex,
} from '@seti/common/constant/sectorSetup';
import { SECTOR_COUNT } from '@seti/common/constant/solarCoordinate';
import { getAdjacentSpaceIds, getMoveCost } from '@seti/common/rules';
import {
  type TTraceRewardPresentation,
  toTraceRewardPresentations,
} from '@seti/common/utils/alienTracePresentation';
import { type CSSProperties, useMemo, useState } from 'react';
import { HotspotAnchor } from '@/features/hotspots/HotspotAnchor';
import { HotspotButton } from '@/features/hotspots/HotspotButton';
import {
  type IOumuamuaDataPillCalibration,
  useOumuamuaCalibration,
  useOumuamuaDataPillCalibration,
} from '@/hooks/useCalibrationMode';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import { useGameViewStore } from '@/stores/gameViewStore';
import type {
  IInputResponse,
  IPlayerInputModel,
  IPublicOumuamuaTile,
  IPublicSector,
  IPublicSectorSignal,
  IPublicSolarSystem,
  IPublicSolarSystemAlienToken,
  IPublicSolarSystemGlyphidsSectorToken,
  IPublicSolarSystemMovablePiece,
  IPublicSolarSystemSpaceState,
  ISelectOptionInputModel,
  TMovementTarget,
  TPublicSlotReward,
} from '@/types/re-exports';
import { EPlayerInputType, ETrace } from '@/types/re-exports';
import { ProbeToken } from './ProbeToken';
import { SectorGrid } from './SectorGrid';
import { SectorSignalList } from './SectorSignalList';
import {
  getWheelSlotLabelBoardPositionPercent,
  WheelLayer,
} from './WheelLayer';

const SOLAR_BOARD_BASE_SIZE_PX = 760;
const SOLAR_BOARD_PANEL_HORIZONTAL_PADDING_PX = 24;
const SOLAR_BOARD_ZOOM_STEP = 0.06;
const SOLAR_BOARD_MIN_ZOOM = 0.72;
const SOLAR_BOARD_MAX_ZOOM = 1.08;
const PROBE_TRANSITION_MS = 900;
const SOLAR_ALIEN_TOKEN_COLOR: Record<
  ETrace.PINK | ETrace.YELLOW | ETrace.BLUE,
  string
> = {
  [ETrace.PINK]: '#d63384',
  [ETrace.YELLOW]: '#f5c242',
  [ETrace.BLUE]: '#3478d8',
};
const TEXT_MODE_LABEL_Z_INDEX_BY_WHEEL: Readonly<
  Record<TSolarSystemWheelIndex, number>
> = {
  1: 75,
  2: 74,
  3: 73,
  4: 72,
};
const ORBITAL_DYNAMICS_MOVE_INPUT_TITLE = 'Choose an Orbital Dynamics move';

export function isOrbitalDynamicsMoveInputModel(
  model: IPlayerInputModel | null,
): model is ISelectOptionInputModel {
  return (
    model?.type === EPlayerInputType.OPTION &&
    model.title === ORBITAL_DYNAMICS_MOVE_INPUT_TITLE
  );
}

interface ISolarSystemViewProps {
  solarSystem: IPublicSolarSystem;
  sectors: IPublicSector[];
  setupConfig: ISolarSystemSetupConfig;
  pendingInput: IPlayerInputModel | null;
  playerColors: Record<string, string>;
  myPlayerId: string;
  movementPoints?: number;
  moveModeActive?: boolean;
  onMoveProbe: (path: string[], target?: TMovementTarget) => void;
  onRespondInput: (response: IInputResponse) => void;
  showSpaceConfigDebug?: boolean;
  allowMoveAnyProbe?: boolean;
  oumuamuaTile?: IPublicOumuamuaTile | null;
  textModeOverride?: boolean;
}

interface ISpacePoint {
  spaceId: string;
  ringIndex: 1 | 2 | 3 | 4;
  indexInRing: number;
  sectorIndex: number;
  cellInSector: number;
  visualIndexInRing: number;
  xPercent: number;
  yPercent: number;
  rotationDeg: number;
}

interface IBoardPieceRenderItem {
  key: string;
  kind: TMovementTarget['type'];
  playerId: string;
  spaceId: string;
  movementTarget: TMovementTarget;
  xPercent: number;
  yPercent: number;
  offsetX: number;
  offsetY: number;
  transitionDelayMs: number;
}

interface IOrbitalDynamicsMovePath {
  optionId: string;
  probeId: string;
  fromSpaceId: string;
  toSpaceId: string;
  path: string[];
  target: TMovementTarget;
}

interface IVisibleMovePath {
  path: string[];
  target?: TMovementTarget;
  optionId?: string;
}

interface ISolarAlienTokenRenderItem {
  key: string;
  token: IPublicSolarSystemAlienToken;
  xPercent: number;
  yPercent: number;
  offsetX: number;
  offsetY: number;
}

interface ISolarGlyphidsSectorTokenRenderItem {
  key: string;
  token: IPublicSolarSystemGlyphidsSectorToken;
  xPercent: number;
  yPercent: number;
  offsetX: number;
  offsetY: number;
}

type TTextModeSpaceLabelKind =
  | 'empty'
  | 'planet'
  | 'earth'
  | 'asteroid'
  | 'comet'
  | 'other';

interface ITextModeSpaceLabel {
  label: string;
  kind: TTextModeSpaceLabelKind;
}

interface ITextModeLabelItem {
  key: string;
  label: ITextModeSpaceLabel;
  styleLayer: TSolarSystemWheelIndex;
  xPercent: number;
  yPercent: number;
  rotationDeg: number;
  offsetX: number;
  offsetY: number;
}

const TEXT_MODE_SPACE_STYLE_BY_RING: Readonly<
  Record<1 | 2 | 3 | 4, { borderColor: string; textColor: string }>
> = {
  1: { borderColor: 'rgba(255,255,255,0.96)', textColor: '#ffffff' },
  2: { borderColor: 'rgba(226,232,240,0.86)', textColor: '#e5e7eb' },
  3: { borderColor: 'rgba(156,163,175,0.78)', textColor: '#cbd5e1' },
  4: { borderColor: 'rgba(100,116,139,0.72)', textColor: '#94a3b8' },
};
function tokenStackOffset(
  index: number,
  count: number,
): { x: number; y: number } {
  if (count <= 1) {
    return { x: 0, y: 0 };
  }

  const columns = Math.min(2, count);
  const rows = Math.ceil(count / columns);
  const col = index % columns;
  const row = Math.floor(index / columns);
  const spacingPx = 10;

  return {
    x: (col - (columns - 1) / 2) * spacingPx,
    y: (row - (rows - 1) / 2) * spacingPx,
  };
}

function normalizeRingIndex(ringIndex: number): 1 | 2 | 3 | 4 | null {
  if (
    ringIndex === 1 ||
    ringIndex === 2 ||
    ringIndex === 3 ||
    ringIndex === 4
  ) {
    return ringIndex;
  }
  return null;
}

function normalizeAngleDeg(angleDeg: number): number {
  return ((angleDeg % 360) + 360) % 360;
}

function clampSolarBoardZoom(zoom: number): number {
  return Math.min(SOLAR_BOARD_MAX_ZOOM, Math.max(SOLAR_BOARD_MIN_ZOOM, zoom));
}

function formatZoomPercent(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

function getWheelSlotRadiusPercent(ringIndex: 1 | 2 | 3 | 4): number {
  const point = getWheelSlotLabelBoardPositionPercent(ringIndex, 0);
  return Math.hypot(point.xPercent - 50, 50 - point.yPercent);
}

function boardPointAtAngle(
  ringIndex: 1 | 2 | 3 | 4,
  rotationDeg: number,
): { xPercent: number; yPercent: number; rotationDeg: number } {
  const radius = getWheelSlotRadiusPercent(ringIndex);
  const angle = (rotationDeg * Math.PI) / 180;
  return {
    xPercent: 50 + Math.sin(angle) * radius,
    yPercent: 50 - Math.cos(angle) * radius,
    rotationDeg,
  };
}

function spacePosition(
  ringIndex: 1 | 2 | 3 | 4,
  sectorIndex: number,
  // Each ring-N sector resolves to the same slot origin used by the
  // debug wheel labels. Cells with `cellInSector > 0` are visual
  // scaffolding and are filtered before hotspot rendering.
  _cellInSector: number,
  _cellsPerSector: number,
): { xPercent: number; yPercent: number; rotationDeg: number } {
  const normalizedSectorIndex =
    ((sectorIndex % SECTOR_COUNT) + SECTOR_COUNT) % SECTOR_COUNT;
  return boardPointAtAngle(ringIndex, (normalizedSectorIndex + 0.5) * 45);
}

/**
 * Cell-anchored position used for the Oumuamua tile so its printed
 * planet image stays at the calibrated wheel-art position relative to
 * Jupiter. Other playable spaces use the sector-centre anchor above.
 */
function cellAnchoredSpacePosition(
  ringIndex: 1 | 2 | 3 | 4,
  sectorIndex: number,
  cellInSector: number,
  cellsPerSector: number,
): { xPercent: number; yPercent: number; rotationDeg: number } {
  const safeCellsPerSector = Math.max(1, cellsPerSector);
  const normalizedSectorIndex =
    ((sectorIndex % SECTOR_COUNT) + SECTOR_COUNT) % SECTOR_COUNT;
  const normalizedCellInSector =
    ((cellInSector % safeCellsPerSector) + safeCellsPerSector) %
    safeCellsPerSector;
  const cellAngleDeg = 45 / safeCellsPerSector;
  const rotationDeg = normalizeAngleDeg(
    (normalizedSectorIndex * safeCellsPerSector +
      normalizedCellInSector +
      0.5) *
      cellAngleDeg,
  );
  return boardPointAtAngle(ringIndex, rotationDeg);
}

function getDiscAngle(
  solarSystem: IPublicSolarSystem,
  ring: 1 | 2 | 3,
): number {
  const disc = solarSystem.discs.find((d) => d.discIndex === ring - 1);
  return disc?.angle ?? 0;
}

function getTextModeSpaceStateLabel(
  state: IPublicSolarSystemSpaceState,
): ITextModeSpaceLabel | null {
  const fallbackElementType =
    state.elementTypes.find((type) => type !== 'NULL') ?? state.elementTypes[0];
  const element =
    state.elements.find((item) => item.type !== 'NULL') ??
    state.elements[0] ??
    (fallbackElementType ? { type: fallbackElementType } : null);

  if (!element || element.type === 'NULL') {
    return null;
  }

  if (element.type === 'EMPTY') {
    return { label: '', kind: 'empty' };
  }

  if (element.type === 'EARTH') {
    return { label: 'earth', kind: 'earth' };
  }

  if (element.type === 'PLANET') {
    return {
      label: element.planet?.toLowerCase() ?? 'planet',
      kind: 'planet',
    };
  }

  if (element.type === 'ASTEROID') {
    return { label: 'asteroid', kind: 'asteroid' };
  }

  if (element.type === 'COMET') {
    return { label: 'comet', kind: 'comet' };
  }

  return { label: element.type.toLowerCase(), kind: 'other' };
}

function buildOumuamuaTileSignals(
  tile: IPublicOumuamuaTile,
): IPublicSectorSignal[] {
  const markerSignals: IPublicSectorSignal[] = tile.markerPlayerIds
    .slice(0, OUMUAMUA_TILE_DATA_CAPACITY)
    .map((playerId) => ({ type: 'player', playerId }));
  const remainingCapacity = Math.max(
    0,
    OUMUAMUA_TILE_DATA_CAPACITY - markerSignals.length,
  );
  const dataCount = Math.min(tile.dataRemaining, remainingCapacity);
  const dataSignals: IPublicSectorSignal[] = Array.from(
    { length: dataCount },
    () => ({ type: 'data' }),
  );
  return [...markerSignals, ...dataSignals];
}

function buildMovablePieces(
  solarSystem: IPublicSolarSystem,
): IPublicSolarSystemMovablePiece[] {
  if (solarSystem.movablePieces) {
    return solarSystem.movablePieces;
  }

  const playerOccurrence: Record<string, number> = {};
  return solarSystem.probes.map((probe) => {
    const occurrence = playerOccurrence[probe.playerId] ?? 0;
    playerOccurrence[probe.playerId] = occurrence + 1;
    const pieceId = probe.probeId ?? `${probe.playerId}-${occurrence}`;
    return {
      pieceId,
      pieceType: 'probe',
      playerId: probe.playerId,
      spaceId: probe.spaceId,
      movementTarget: { type: 'probe', id: pieceId },
    };
  });
}

function getPieceTransitionDelay(
  piece: IPublicSolarSystemMovablePiece,
  solarSystem: IPublicSolarSystem,
): number {
  if (piece.pieceType !== 'probe') {
    return 0;
  }

  return (
    solarSystem.probes.find((probe) => probe.probeId === piece.pieceId)
      ?.transitionDelayMs ?? 0
  );
}

export function SolarSystemView({
  solarSystem,
  sectors,
  setupConfig,
  pendingInput,
  playerColors,
  myPlayerId,
  movementPoints = 0,
  moveModeActive = false,
  onMoveProbe,
  onRespondInput,
  showSpaceConfigDebug = false,
  allowMoveAnyProbe = false,
  oumuamuaTile = null,
  textModeOverride,
}: ISolarSystemViewProps): React.JSX.Element {
  const [selectedMoveTarget, setSelectedMoveTarget] = useState<{
    spaceId: string;
    target?: TMovementTarget;
  } | null>(null);
  const globalTextMode = useTextMode();
  const textMode = textModeOverride ?? globalTextMode;
  const solarBoardZoom = useGameViewStore((state) => state.zoom);
  const setSolarBoardZoom = useGameViewStore((state) => state.setZoom);
  const normalizedSolarBoardZoom = clampSolarBoardZoom(solarBoardZoom);
  const oumuamuaDataPillCalibration = useOumuamuaDataPillCalibration();
  const solarBoardWidthPx = Math.round(
    SOLAR_BOARD_BASE_SIZE_PX * normalizedSolarBoardZoom,
  );
  const solarBoardPanelWidthPx =
    solarBoardWidthPx + SOLAR_BOARD_PANEL_HORIZONTAL_PADDING_PX;
  const panelStyle: CSSProperties = {
    width: `${solarBoardPanelWidthPx}px`,
  };
  const boardStyle: CSSProperties = {
    width: `${solarBoardWidthPx}px`,
    // Expose the current zoom scale so descendants (sector data slots,
    // alien tokens, etc.) can scale fixed-px layouts proportionally
    // instead of staying frozen as the board shrinks/grows.
    ['--solar-board-scale' as string]: `${normalizedSolarBoardZoom}`,
    ...(textMode
      ? { backgroundColor: 'rgba(8, 13, 25, 0.6)' }
      : {
          backgroundImage: 'url(/assets/seti/boards/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }),
  };

  const spacePoints = useMemo<ISpacePoint[]>(() => {
    const states = solarSystem.spaceStates;
    if (!states) {
      return [];
    }

    return solarSystem.spaces.flatMap((spaceId): ISpacePoint[] => {
      const state = states[spaceId];
      if (!state) {
        return [];
      }

      const ringIndex = normalizeRingIndex(state.ringIndex);
      if (!ringIndex) {
        return [];
      }

      const indexInRing = state.indexInRing;
      const sectorIndex = state.sectorIndex;
      const cellInSector = state.cellInSector;
      const cellsPerSector = ringIndex;
      // Oumuamua's tile keeps the cell-anchored angle so its
      // printed planet image (and the 3-data dot pill) stay at their
      // calibrated positions relative to the wheel art. The rest of
      // the board uses the shared debug-wheel slot origin.
      const isOumuamuaTile =
        oumuamuaTile?.spaceId !== undefined && spaceId === oumuamuaTile.spaceId;
      const pos = isOumuamuaTile
        ? cellAnchoredSpacePosition(
            ringIndex,
            sectorIndex,
            cellInSector,
            cellsPerSector,
          )
        : spacePosition(ringIndex, sectorIndex, cellInSector, cellsPerSector);
      return [
        {
          spaceId,
          ringIndex,
          indexInRing,
          sectorIndex,
          cellInSector,
          visualIndexInRing: sectorIndex * cellsPerSector + cellInSector,
          ...pos,
        },
      ];
    });
  }, [oumuamuaTile?.spaceId, solarSystem.spaces, solarSystem.spaceStates]);

  const debugLabelsBySpaceId = useMemo(() => {
    if (!showSpaceConfigDebug) {
      return undefined;
    }

    const labels: Record<string, string> = {};
    for (const space of spacePoints) {
      const state = solarSystem.spaceStates[space.spaceId];
      const slotPrefix = `${space.indexInRing}:`;
      if (!state) {
        labels[space.spaceId] = slotPrefix;
        continue;
      }

      const primaryElement = state.elements?.[0];
      const firstType = primaryElement?.type ?? state.elementTypes[0] ?? '-';
      if (firstType === 'PLANET' && primaryElement?.planet) {
        labels[space.spaceId] =
          `${slotPrefix}${primaryElement.planet.toLowerCase()}`;
      } else {
        labels[space.spaceId] = `${slotPrefix}${firstType.toLowerCase()}`;
      }
    }

    return labels;
  }, [showSpaceConfigDebug, spacePoints, solarSystem.spaceStates]);

  const textModeLabelItems = useMemo<ITextModeLabelItem[]>(() => {
    if (!textMode) {
      return [];
    }

    return spacePoints.flatMap((point): ITextModeLabelItem[] => {
      if (point.cellInSector !== 0) {
        return [];
      }

      const state = solarSystem.spaceStates[point.spaceId];
      if (!state) {
        return [];
      }

      const label = getTextModeSpaceStateLabel(state);
      if (!label) {
        return [];
      }
      const labelOffset =
        oumuamuaTile?.spaceId !== undefined &&
        point.spaceId === oumuamuaTile.spaceId
          ? getOumuamuaTextCellOffset(
              point.rotationDeg,
              normalizedSolarBoardZoom,
              oumuamuaDataPillCalibration,
            )
          : { x: 0, y: 0 };

      return [
        {
          key: `state:${point.spaceId}`,
          label,
          styleLayer: point.ringIndex,
          xPercent: point.xPercent,
          yPercent: point.yPercent,
          rotationDeg: point.rotationDeg,
          offsetX: labelOffset.x,
          offsetY: labelOffset.y,
        },
      ];
    });
  }, [
    textMode,
    solarSystem.spaceStates,
    spacePoints,
    oumuamuaTile?.spaceId,
    normalizedSolarBoardZoom,
    oumuamuaDataPillCalibration,
  ]);

  const boardPieceView = useMemo(() => {
    const bySpacePlayers: Record<string, string[]> = {};
    const spacePointById = new Map(
      spacePoints.map((point) => [point.spaceId, point]),
    );
    const grouped: Record<
      string,
      Array<{
        key: string;
        kind: TMovementTarget['type'];
        playerId: string;
        movementTarget: TMovementTarget;
        transitionDelayMs: number;
      }>
    > = {};

    const movablePieces = buildMovablePieces(solarSystem);
    for (const piece of movablePieces) {
      if (!bySpacePlayers[piece.spaceId]) {
        bySpacePlayers[piece.spaceId] = [];
      }
      bySpacePlayers[piece.spaceId].push(piece.playerId);

      if (!grouped[piece.spaceId]) {
        grouped[piece.spaceId] = [];
      }
      grouped[piece.spaceId].push({
        key: piece.pieceId,
        kind: piece.pieceType,
        playerId: piece.playerId,
        movementTarget: piece.movementTarget,
        transitionDelayMs: getPieceTransitionDelay(piece, solarSystem),
      });
    }

    const renderItems: IBoardPieceRenderItem[] = [];
    const targetsBySpace: Record<
      string,
      Array<{ playerId: string; movementTarget: TMovementTarget }>
    > = {};
    for (const [spaceId, pieces] of Object.entries(grouped)) {
      const point = spacePointById.get(spaceId);
      if (!point) {
        continue;
      }

      // Image mode parks probes on the printed Oumuamua glyph. Text mode
      // keeps them on the shifted debug cell instead.
      const oumuamuaProbeNudge =
        oumuamuaTile?.spaceId !== undefined && spaceId === oumuamuaTile.spaceId
          ? textMode
            ? getOumuamuaTextCellOffset(
                point.rotationDeg,
                normalizedSolarBoardZoom,
                oumuamuaDataPillCalibration,
              )
            : (() => {
                const angleRad = (point.rotationDeg * Math.PI) / 180;
                const t = OUMUAMUA_PROBE_LANDING_OFFSET.tangentialPx;
                const r = OUMUAMUA_PROBE_LANDING_OFFSET.radialPx;
                return {
                  x: Math.cos(angleRad) * t + Math.sin(angleRad) * r,
                  y: Math.sin(angleRad) * t + -Math.cos(angleRad) * r,
                };
              })()
          : { x: 0, y: 0 };

      for (let index = 0; index < pieces.length; index += 1) {
        const piece = pieces[index];
        const offset = tokenStackOffset(index, pieces.length);
        renderItems.push({
          key: piece.key,
          kind: piece.kind,
          playerId: piece.playerId,
          movementTarget: piece.movementTarget,
          spaceId,
          xPercent: point.xPercent,
          yPercent: point.yPercent,
          offsetX: offset.x + oumuamuaProbeNudge.x,
          offsetY: offset.y + oumuamuaProbeNudge.y,
          transitionDelayMs: piece.transitionDelayMs,
        });
        const targets = targetsBySpace[spaceId] ?? [];
        targets.push({
          playerId: piece.playerId,
          movementTarget: piece.movementTarget,
        });
        targetsBySpace[spaceId] = targets;
      }
    }

    return { bySpacePlayers, renderItems, targetsBySpace };
  }, [
    oumuamuaTile?.spaceId,
    solarSystem,
    spacePoints,
    textMode,
    normalizedSolarBoardZoom,
    oumuamuaDataPillCalibration,
  ]);

  const isOrbitalDynamicsMoveInput =
    isOrbitalDynamicsMoveInputModel(pendingInput);

  const orbitalDynamicsMovePaths = useMemo<IOrbitalDynamicsMovePath[]>(() => {
    if (!isOrbitalDynamicsMoveInput) {
      return [];
    }

    const pieceByProbeId = new Map(
      boardPieceView.renderItems
        .filter((piece) => piece.kind === 'probe')
        .map((piece) => [piece.movementTarget.id, piece]),
    );

    return (pendingInput as ISelectOptionInputModel).options.flatMap(
      (option): IOrbitalDynamicsMovePath[] => {
        const [probeId, toSpaceId, extra] = option.id.split(':');
        if (!probeId || !toSpaceId || extra !== undefined) {
          return [];
        }

        const piece = pieceByProbeId.get(probeId);
        if (!piece || piece.playerId !== myPlayerId) {
          return [];
        }

        if (
          !getAdjacentSpaceIds(solarSystem, piece.spaceId).includes(toSpaceId)
        ) {
          return [];
        }

        return [
          {
            optionId: option.id,
            probeId,
            fromSpaceId: piece.spaceId,
            toSpaceId,
            path: [piece.spaceId, toSpaceId],
            target: piece.movementTarget,
          },
        ];
      },
    );
  }, [
    boardPieceView.renderItems,
    isOrbitalDynamicsMoveInput,
    myPlayerId,
    pendingInput,
    solarSystem,
  ]);

  const orbitalDynamicsMovableProbeIds = useMemo(
    () => new Set(orbitalDynamicsMovePaths.map((move) => move.probeId)),
    [orbitalDynamicsMovePaths],
  );

  const orbitalDynamicsPathBySpaceId = useMemo<
    Map<string, IVisibleMovePath>
  >(() => {
    const selectedProbeId =
      selectedMoveTarget?.target?.type === 'probe'
        ? selectedMoveTarget.target.id
        : null;
    const paths = new Map<string, IVisibleMovePath>();

    for (const move of orbitalDynamicsMovePaths) {
      if (selectedProbeId && move.probeId !== selectedProbeId) {
        continue;
      }
      if (paths.has(move.toSpaceId)) {
        continue;
      }
      paths.set(move.toSpaceId, {
        path: move.path,
        target: move.target,
        optionId: move.optionId,
      });
    }

    return paths;
  }, [orbitalDynamicsMovePaths, selectedMoveTarget]);

  const solarAlienTokenView = useMemo<ISolarAlienTokenRenderItem[]>(() => {
    const groupedByAnchor = new Map<
      string,
      {
        position: { xPercent: number; yPercent: number };
        tokens: IPublicSolarSystemAlienToken[];
      }
    >();
    for (const token of solarSystem.alienTokens) {
      const key = `sector:${token.sectorIndex}`;
      const group = groupedByAnchor.get(key) ?? {
        position: spacePosition(4, token.sectorIndex, 0, 1),
        tokens: [],
      };
      group.tokens.push(token);
      groupedByAnchor.set(key, group);
    }

    const items: ISolarAlienTokenRenderItem[] = [];
    for (const { position, tokens } of groupedByAnchor.values()) {
      for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        const offset = tokenStackOffset(index, tokens.length);
        items.push({
          key: token.tokenId,
          token,
          xPercent: position.xPercent,
          yPercent: position.yPercent,
          offsetX: offset.x,
          offsetY: offset.y,
        });
      }
    }

    return items;
  }, [solarSystem.alienTokens]);

  const solarGlyphidsSectorTokenView = useMemo<
    ISolarGlyphidsSectorTokenRenderItem[]
  >(() => {
    const groupedByAnchor = new Map<
      number,
      {
        position: { xPercent: number; yPercent: number };
        tokens: IPublicSolarSystemGlyphidsSectorToken[];
      }
    >();

    for (const token of solarSystem.glyphidsSectorTokens ?? []) {
      const group = groupedByAnchor.get(token.sectorIndex) ?? {
        position: spacePosition(4, token.sectorIndex, 0, 1),
        tokens: [],
      };
      group.tokens.push(token);
      groupedByAnchor.set(token.sectorIndex, group);
    }

    const items: ISolarGlyphidsSectorTokenRenderItem[] = [];
    for (const { position, tokens } of groupedByAnchor.values()) {
      for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        const offset = tokenStackOffset(index, tokens.length);
        items.push({
          key: token.tokenId,
          token,
          xPercent: position.xPercent,
          yPercent: position.yPercent,
          offsetX: offset.x,
          offsetY: offset.y,
        });
      }
    }

    return items;
  }, [solarSystem.glyphidsSectorTokens]);

  const oumuamuaSectorData = useMemo(() => {
    if (!oumuamuaTile) {
      return null;
    }

    const point = spacePoints.find(
      (space) => space.spaceId === oumuamuaTile.spaceId,
    );
    if (!point) {
      return null;
    }

    return {
      point,
      tile: oumuamuaTile,
      signals: buildOumuamuaTileSignals(oumuamuaTile),
    };
  }, [oumuamuaTile, spacePoints]);

  // 1-hop adjacency reachability: only direct neighbors of the source
  // space whose `getMoveCost` fits in the player's remaining movement.
  // Multi-hop paths bundled visit/leave events into a single click,
  // so a probe entering an asteroid then leaving never showed the +1
  // leave cost in the picker, and a probe drifting past a comet didn't
  // get a chance to halt before triggering Oumuamua-tile pickup. The
  // server resolves each hop independently, so re-render after each
  // committed hop lets the player decide the next step with the
  // correct picture.
  const reachablePathBySpaceId = useMemo(() => {
    if (!selectedMoveTarget || movementPoints <= 0) {
      return new Map<string, string[]>();
    }
    const fromSpaceId = selectedMoveTarget.spaceId;
    const paths = new Map<string, string[]>();
    for (const neighborId of getAdjacentSpaceIds(solarSystem, fromSpaceId)) {
      const cost = getMoveCost(solarSystem, fromSpaceId, neighborId);
      if (!Number.isFinite(cost) || cost > movementPoints) {
        continue;
      }
      paths.set(neighborId, [fromSpaceId, neighborId]);
    }
    return paths;
  }, [selectedMoveTarget, movementPoints, solarSystem]);

  const activeMovePathBySpaceId = useMemo(() => {
    if (!moveModeActive || movementPoints <= 0) {
      return new Map<
        string,
        { movementCost: number; path: string[]; target: TMovementTarget }
      >();
    }

    const paths = new Map<
      string,
      { movementCost: number; path: string[]; target: TMovementTarget }
    >();
    for (const piece of boardPieceView.renderItems) {
      if (!allowMoveAnyProbe && piece.playerId !== myPlayerId) {
        continue;
      }
      for (const neighborId of getAdjacentSpaceIds(
        solarSystem,
        piece.spaceId,
      )) {
        const cost = getMoveCost(solarSystem, piece.spaceId, neighborId);
        if (!Number.isFinite(cost) || cost > movementPoints) {
          continue;
        }
        const known = paths.get(neighborId);
        if (known && known.movementCost <= cost) {
          continue;
        }
        paths.set(neighborId, {
          movementCost: cost,
          path: [piece.spaceId, neighborId],
          target: piece.movementTarget,
        });
      }
    }

    return paths;
  }, [
    allowMoveAnyProbe,
    boardPieceView.renderItems,
    moveModeActive,
    movementPoints,
    myPlayerId,
    solarSystem,
  ]);

  const visibleReachablePathBySpaceId = useMemo<
    Map<string, IVisibleMovePath>
  >(() => {
    if (isOrbitalDynamicsMoveInput) {
      return orbitalDynamicsPathBySpaceId;
    }

    if (selectedMoveTarget) {
      return new Map<string, IVisibleMovePath>(
        [...reachablePathBySpaceId.entries()].map(
          ([spaceId, path]) =>
            [spaceId, { path, target: selectedMoveTarget.target }] as const,
        ),
      );
    }

    if (!moveModeActive) {
      return new Map<string, IVisibleMovePath>();
    }

    return new Map<string, IVisibleMovePath>(
      [...activeMovePathBySpaceId.entries()].map(
        ([spaceId, entry]) =>
          [spaceId, { path: entry.path, target: entry.target }] as const,
      ),
    );
  }, [
    activeMovePathBySpaceId,
    isOrbitalDynamicsMoveInput,
    moveModeActive,
    orbitalDynamicsPathBySpaceId,
    reachablePathBySpaceId,
    selectedMoveTarget,
  ]);

  const reachable = useMemo(
    () => new Set(visibleReachablePathBySpaceId.keys()),
    [visibleReachablePathBySpaceId],
  );

  function submitMovePath(path: string[], target?: TMovementTarget): void {
    onMoveProbe(path, target);
  }

  function changeSolarBoardZoom(delta: number): void {
    setSolarBoardZoom(clampSolarBoardZoom(normalizedSolarBoardZoom + delta));
  }

  function handleSpaceClick(spaceId: string): void {
    const activeMovePath = visibleReachablePathBySpaceId.get(spaceId);
    if (activeMovePath) {
      if (
        activeMovePath.optionId &&
        pendingInput?.type === EPlayerInputType.OPTION
      ) {
        onRespondInput({
          inputId: pendingInput.inputId,
          type: EPlayerInputType.OPTION,
          optionId: activeMovePath.optionId,
        });
        setSelectedMoveTarget(null);
        return;
      }
      submitMovePath(activeMovePath.path, activeMovePath.target);
      setSelectedMoveTarget(moveModeActive ? null : { spaceId });
      return;
    }

    const moveTargets = boardPieceView.targetsBySpace[spaceId] ?? [];
    const ownTarget = moveTargets.find(
      (target) => target.playerId === myPlayerId,
    );
    const anyTarget = moveTargets[0];
    const selectableTarget =
      ownTarget ?? (allowMoveAnyProbe ? anyTarget : undefined);
    const hasMyProbe = (boardPieceView.bySpacePlayers[spaceId] ?? []).includes(
      myPlayerId,
    );
    const hasAnyProbe =
      (boardPieceView.bySpacePlayers[spaceId] ?? []).length > 0;
    const canSelectOrbitalDynamicsProbe =
      selectableTarget?.movementTarget.type === 'probe' &&
      orbitalDynamicsMovableProbeIds.has(selectableTarget.movementTarget.id);
    if (
      selectableTarget &&
      (canSelectOrbitalDynamicsProbe ||
        (!isOrbitalDynamicsMoveInput &&
          (hasMyProbe || (allowMoveAnyProbe && hasAnyProbe))))
    ) {
      setSelectedMoveTarget((prev) =>
        prev?.spaceId === spaceId &&
        prev.target?.type === selectableTarget.movementTarget.type &&
        prev.target.id === selectableTarget.movementTarget.id
          ? null
          : { spaceId, target: selectableTarget.movementTarget },
      );
      return;
    }

    if (selectedMoveTarget) {
      const path = visibleReachablePathBySpaceId.get(spaceId);
      if (!path) {
        return;
      }
      submitMovePath(path.path, path.target);
      setSelectedMoveTarget(moveModeActive ? null : { spaceId });
    }
  }

  return (
    <section
      data-testid='solar-board-panel'
      className='shrink-0 rounded-lg border border-surface-700/40 bg-surface-900/30 p-3 transition-[width]'
      style={panelStyle}
    >
      <header className='mb-2 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          Solar System
        </h2>
        <div className='flex items-center gap-2'>
          <div
            className='inline-flex h-7 items-center gap-1 rounded-sm border border-surface-700/70 bg-surface-950/60 px-1 font-mono text-[10px] text-text-300'
            aria-label='Solar board zoom controls'
          >
            <span className='px-1 text-[11px] leading-none text-text-400'>
              ⌕
            </span>
            <button
              type='button'
              aria-label='Zoom solar board out'
              className='grid h-5 w-5 place-items-center rounded-sm border border-surface-700 bg-surface-900 text-text-100 transition-colors hover:bg-surface-800 disabled:cursor-not-allowed disabled:opacity-40'
              disabled={
                normalizedSolarBoardZoom <= SOLAR_BOARD_MIN_ZOOM + 0.001
              }
              onClick={() => changeSolarBoardZoom(-SOLAR_BOARD_ZOOM_STEP)}
            >
              -
            </button>
            <span
              data-testid='solar-board-zoom-value'
              className='w-8 text-center tabular-nums text-text-200'
            >
              {formatZoomPercent(normalizedSolarBoardZoom)}
            </span>
            <button
              type='button'
              aria-label='Zoom solar board in'
              className='grid h-5 w-5 place-items-center rounded-sm border border-surface-700 bg-surface-900 text-text-100 transition-colors hover:bg-surface-800 disabled:cursor-not-allowed disabled:opacity-40'
              disabled={
                normalizedSolarBoardZoom >= SOLAR_BOARD_MAX_ZOOM - 0.001
              }
              onClick={() => changeSolarBoardZoom(SOLAR_BOARD_ZOOM_STEP)}
            >
              +
            </button>
          </div>

          {solarSystem.nextRotateRing ? (
            <div className='flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-400'>
              <span>Next Rotate:</span>
              <img
                src={`/assets/seti/tech/bonuses/techRotation${solarSystem.nextRotateRing}.png`}
                alt='Next rotate ring'
                className='h-6 w-6'
              />
            </div>
          ) : null}
        </div>
      </header>

      <div
        data-testid='solar-board-frame'
        className='relative mx-auto aspect-square overflow-hidden rounded-md transition-[width]'
        style={boardStyle}
      >
        <WheelLayer ring={4} angle={0} className='z-10' showImage={!textMode} />
        <WheelLayer
          ring={3}
          angle={getDiscAngle(solarSystem, 3)}
          className='z-20'
          showImage={!textMode}
        />
        <WheelLayer
          ring={2}
          angle={getDiscAngle(solarSystem, 2)}
          className='z-30'
          showImage={!textMode}
        />
        <WheelLayer
          ring={1}
          angle={getDiscAngle(solarSystem, 1)}
          className='z-40'
          showImage={!textMode}
        />

        {!textMode && (
          <HotspotAnchor
            sceneId='solar-system'
            hotspotId='sun'
            variant='image'
            baseWidth={SOLAR_BOARD_BASE_SIZE_PX}
            baseHeight={SOLAR_BOARD_BASE_SIZE_PX}
            x={SOLAR_BOARD_BASE_SIZE_PX / 2}
            y={SOLAR_BOARD_BASE_SIZE_PX / 2}
            width={SOLAR_BOARD_BASE_SIZE_PX * 0.1}
            height={SOLAR_BOARD_BASE_SIZE_PX * 0.1}
            color='#facc15'
            debugLabel='solar sun'
            className='z-50 select-none'
            testId='solar-sun'
          >
            <img
              src='/assets/seti/sun.png'
              alt=''
              aria-hidden
              className='pointer-events-none h-full w-full select-none'
              style={{ animation: 'spin 1800s linear infinite' }}
              draggable={false}
            />
          </HotspotAnchor>
        )}

        <SectorGrid
          sectors={sectors}
          setupConfig={setupConfig}
          playerColors={playerColors}
          pendingInput={pendingInput}
          boardScale={normalizedSolarBoardZoom}
          textModeOverride={textMode}
          onSelectSector={(sectorColor) => {
            if (pendingInput?.type !== EPlayerInputType.SECTOR) {
              return;
            }
            onRespondInput({
              inputId: pendingInput.inputId,
              type: EPlayerInputType.SECTOR,
              sector: sectorColor,
            });
          }}
          onSelectSectorId={(sectorId) => {
            if (pendingInput?.type !== EPlayerInputType.OPTION) {
              return;
            }
            onRespondInput({
              inputId: pendingInput.inputId,
              type: EPlayerInputType.OPTION,
              optionId: sectorId,
            });
          }}
        />

        {spacePoints
          .filter((space) => space.cellInSector === 0)
          .map((space) => {
            const spaceState = solarSystem.spaceStates[space.spaceId];
            const planet = spaceState?.elements?.find(
              (element) => element.planet !== undefined,
            )?.planet;
            const probeCount =
              boardPieceView.bySpacePlayers[space.spaceId]?.length ?? 0;
            const hasMyProbe = (
              boardPieceView.bySpacePlayers[space.spaceId] ?? []
            ).includes(myPlayerId);
            const isSelected = selectedMoveTarget?.spaceId === space.spaceId;
            const isReachable = reachable.has(space.spaceId);
            const isOrbitalDynamicsMoveSource = orbitalDynamicsMovePaths.some(
              (move) => move.fromSpaceId === space.spaceId,
            );
            const isMoveOverlayVisible =
              isSelected ||
              isReachable ||
              isOrbitalDynamicsMoveSource ||
              (moveModeActive && hasMyProbe);

            // Match the hotspot to whichever Oumuamua cell is visible in
            // the current mode.
            const isOumuamuaHotspot =
              oumuamuaTile?.spaceId !== undefined &&
              space.spaceId === oumuamuaTile.spaceId;
            const hotspotNudge = isOumuamuaHotspot
              ? textMode
                ? getOumuamuaTextCellOffset(
                    space.rotationDeg,
                    normalizedSolarBoardZoom,
                    oumuamuaDataPillCalibration,
                  )
                : (() => {
                    const angleRad = (space.rotationDeg * Math.PI) / 180;
                    const t = OUMUAMUA_PROBE_LANDING_OFFSET.tangentialPx;
                    const r = OUMUAMUA_PROBE_LANDING_OFFSET.radialPx;
                    return {
                      x: Math.cos(angleRad) * t + Math.sin(angleRad) * r,
                      y: Math.sin(angleRad) * t + -Math.cos(angleRad) * r,
                    };
                  })()
              : { x: 0, y: 0 };

            return (
              <HotspotButton
                key={space.spaceId}
                sceneId='solar-system'
                hotspotId={space.spaceId}
                variant={textMode ? 'text' : 'image'}
                baseWidth={SOLAR_BOARD_BASE_SIZE_PX}
                baseHeight={SOLAR_BOARD_BASE_SIZE_PX}
                x={(space.xPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
                y={(space.yPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
                xPercent={space.xPercent}
                yPercent={space.yPercent}
                width={28}
                height={28}
                offsetX={hotspotNudge.x}
                offsetY={hotspotNudge.y}
                testId={`solar-space-${space.spaceId}`}
                dataAttributes={{
                  'data-planet': planet,
                  'data-element-types': spaceState?.elementTypes.join(' '),
                }}
                className='transition-all hover:border-accent-400/60 focus-visible:ring-accent-500/60'
                style={{
                  zIndex: isMoveOverlayVisible ? 90 : undefined,
                }}
                onClick={() => handleSpaceClick(space.spaceId)}
                title={`${space.spaceId} - pieces: ${probeCount}`}
                ariaLabel={`Space ${space.spaceId}`}
                debugLabel={space.spaceId}
              >
                {(isSelected ||
                  isReachable ||
                  isOrbitalDynamicsMoveSource ||
                  hasMyProbe) && (
                  <span
                    data-reachable-indicator={isReachable ? 'true' : undefined}
                    className={[
                      'absolute inset-0 rounded-full',
                      isSelected
                        ? 'border border-accent-400 bg-accent-500/20'
                        : isReachable
                          ? 'animate-pulse border border-accent-500/80 bg-accent-500/10'
                          : 'border border-surface-400/60 bg-surface-300/10',
                    ].join(' ')}
                  />
                )}
              </HotspotButton>
            );
          })}

        {textMode &&
          textModeLabelItems.map((item) => {
            const layerStyle = TEXT_MODE_SPACE_STYLE_BY_RING[item.styleLayer];
            const isPlanetLabel =
              item.label.kind === 'planet' || item.label.kind === 'earth';
            return (
              <span
                key={`text-mode-label-${item.key}`}
                className='pointer-events-none absolute'
                data-testid={`solar-text-cell-${item.key}`}
                style={{
                  left: `${item.xPercent}%`,
                  top: `${item.yPercent}%`,
                  transform:
                    item.offsetX === 0 && item.offsetY === 0
                      ? 'translate(-50%, -50%)'
                      : `translate(calc(-50% + ${item.offsetX}px), calc(-50% + ${item.offsetY}px))`,
                  zIndex: TEXT_MODE_LABEL_Z_INDEX_BY_WHEEL[item.styleLayer],
                }}
              >
                <span
                  className={cn(
                    'inline-flex h-[16px] w-[38px] items-center justify-center overflow-hidden rounded-sm border font-mono text-[7px] uppercase leading-none shadow-[0_1px_2px_rgba(0,0,0,0.65)]',
                    item.label.kind === 'empty'
                      ? 'border-surface-500 bg-surface-950 text-transparent'
                      : 'border-surface-500 bg-surface-900 text-text-100',
                    isPlanetLabel && 'font-bold',
                  )}
                  style={{
                    transform: `rotate(${item.rotationDeg}deg)`,
                    transformOrigin: 'center',
                    backgroundColor:
                      item.label.kind === 'empty'
                        ? 'rgba(2, 6, 23, 0.96)'
                        : undefined,
                    borderColor: layerStyle.borderColor,
                    color:
                      item.label.kind === 'empty'
                        ? 'transparent'
                        : isPlanetLabel
                          ? '#ffffff'
                          : layerStyle.textColor,
                  }}
                >
                  {item.label.label}
                </span>
              </span>
            );
          })}

        {oumuamuaSectorData ? (
          <>
            <OumuamuaPlanetArt
              point={oumuamuaSectorData.point}
              boardWidthPx={solarBoardWidthPx}
              textMode={textMode}
            />
            <OumuamuaSectorDataList
              point={oumuamuaSectorData.point}
              tile={oumuamuaSectorData.tile}
              signals={oumuamuaSectorData.signals}
              playerColors={playerColors}
              textMode={textMode}
              boardScale={normalizedSolarBoardZoom}
              calibration={oumuamuaDataPillCalibration}
            />
          </>
        ) : null}

        {solarAlienTokenView.map((item) => (
          <SolarAlienTokenMarker
            key={item.key}
            token={item.token}
            xPercent={item.xPercent}
            yPercent={item.yPercent}
            offsetX={item.offsetX}
            offsetY={item.offsetY}
            textMode={textMode}
          />
        ))}

        {solarGlyphidsSectorTokenView.map((item) => (
          <SolarGlyphidsSectorTokenMarker
            key={item.key}
            token={item.token}
            xPercent={item.xPercent}
            yPercent={item.yPercent}
            offsetX={item.offsetX}
            offsetY={item.offsetY}
            textMode={textMode}
          />
        ))}

        {boardPieceView.renderItems.map((piece) => (
          <HotspotAnchor
            key={piece.key}
            sceneId='solar-system'
            hotspotId={`${piece.kind}-${piece.key}`}
            variant={textMode ? 'text' : 'image'}
            baseWidth={SOLAR_BOARD_BASE_SIZE_PX}
            baseHeight={SOLAR_BOARD_BASE_SIZE_PX}
            x={(piece.xPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
            y={(piece.yPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
            width={24}
            height={24}
            offsetX={piece.offsetX}
            offsetY={piece.offsetY}
            color={playerColors[piece.playerId] ?? '#e5e7eb'}
            debugLabel={`${piece.kind} ${piece.key}`}
            className='z-80'
            testId={
              piece.kind === 'mascamites-capsule'
                ? `solar-capsule-${piece.key}`
                : `solar-probe-${piece.key}`
            }
            dataAttributes={{
              'data-player-id': piece.playerId,
              'data-space-id': piece.spaceId,
            }}
            style={{
              transition: `left ${PROBE_TRANSITION_MS}ms ease-out, top ${PROBE_TRANSITION_MS}ms ease-out, transform ${PROBE_TRANSITION_MS}ms ease-out`,
              transitionDelay:
                piece.transitionDelayMs > 0
                  ? `${piece.transitionDelayMs}ms`
                  : undefined,
            }}
          >
            {piece.kind === 'mascamites-capsule' ? (
              <CapsuleToken
                playerColor={playerColors[piece.playerId] ?? 'white'}
              />
            ) : (
              <ProbeToken
                playerColor={playerColors[piece.playerId] ?? 'white'}
              />
            )}
          </HotspotAnchor>
        ))}

        {showSpaceConfigDebug && (
          <div
            className='pointer-events-none absolute inset-0'
            style={{ zIndex: 90 }}
          >
            {spacePoints.map((space) => (
              <span
                key={`debug-space-label-${space.spaceId}`}
                className='absolute z-20 rounded bg-surface-950/85 px-1 py-0.5 text-[9px] font-mono uppercase leading-none text-text-200 shadow'
                style={{
                  left: `${space.xPercent}%`,
                  top: `${space.yPercent}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {debugLabelsBySpaceId?.[space.spaceId] ??
                  `${space.indexInRing}:`}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Width of the printed Oumuamua planet image as a fraction of the solar
 * board width. Calibrated against the printed wheel art so the tile's
 * notch wraps the adjacent ring-3 feature; iterate via `?oumScale=…`
 * before locking in.
 */
const OUMUAMUA_PLANET_BASE_WIDTH_FRACTION = 0.195;
const OUMUAMUA_PLANET_ASPECT_RATIO = 594 / 365;

/**
 * Image-local rotation applied so the printed "OUMUAMUA" text and the 1/2/3
 * data circles end up facing the centre of the wheel after the tile-angle
 * rotation is added on. Placeholder of 0° — calibrate live with `?oumRot=…`.
 */
const OUMUAMUA_PLANET_BASE_ROTATION_DEG = 217;

/**
 * Pixel offset of the planet image from the tile's space-centre, in the
 * tile's local frame:
 *   - `tangentialPx`: positive = clockwise around the sun.
 *   - `radialPx`:     positive = away from the sun.
 * Calibration knobs (`?oumT=`/`?oumR=`) are added on top so you can
 * iterate live, then bake the final numbers in here.
 */
const OUMUAMUA_PLANET_BASE_OFFSET = {
  tangentialPx: -35,
  radialPx: -14,
} as const;

/**
 * Per-cell pixel nudge applied to probe pieces parked on the Oumuamua
 * tile, in the tile's local frame:
 *   - `tangentialPx`: positive = clockwise around the sun.
 *   - `radialPx`:     positive = away from the sun.
 * Tweak so probes land on the printed Oumuamua tile glyph rather than
 * the cell's geometric anchor (which sits off-image because the
 * printed planet isn't centred in the wheel cell).
 */
const OUMUAMUA_PROBE_LANDING_OFFSET = {
  tangentialPx: 75,
  radialPx: -15,
} as const;

function OumuamuaPlanetArt({
  point,
  boardWidthPx,
  textMode,
}: {
  point: ISpacePoint;
  boardWidthPx: number;
  textMode: boolean;
}): React.JSX.Element | null {
  const calibration = useOumuamuaCalibration();
  // Skip the planet PNG in text mode — text mode is a debug aid that
  // intentionally hides image-mode art.
  if (textMode) {
    return null;
  }

  const widthPx = Math.round(
    boardWidthPx * OUMUAMUA_PLANET_BASE_WIDTH_FRACTION * calibration.scale,
  );
  const heightPx = Math.round(widthPx / OUMUAMUA_PLANET_ASPECT_RATIO);
  const boardScale = boardWidthPx / SOLAR_BOARD_BASE_SIZE_PX;

  // Convert tangential / radial pixel offsets (calibration knobs) to x/y
  // pixel offsets in the un-rotated image-local frame. The image is
  // rotated by `point.rotationDeg + base + offset` around its centre, so
  // applying offsets BEFORE the rotation keeps "T" tangential and "R"
  // radial regardless of which sector the tile sits in.
  const angleRad =
    ((point.rotationDeg + OUMUAMUA_PLANET_BASE_ROTATION_DEG) * Math.PI) / 180;
  const tangentialPx =
    OUMUAMUA_PLANET_BASE_OFFSET.tangentialPx + calibration.offsetT;
  const radialPx = OUMUAMUA_PLANET_BASE_OFFSET.radialPx + calibration.offsetR;
  const tangentX = Math.cos(angleRad) * tangentialPx;
  const tangentY = Math.sin(angleRad) * tangentialPx;
  const radialX = Math.sin(angleRad) * radialPx;
  const radialY = -Math.cos(angleRad) * radialPx;
  const offsetX = tangentX + radialX;
  const offsetY = tangentY + radialY;

  return (
    <HotspotAnchor
      sceneId='solar-system'
      hotspotId={`oumuamua-planet-${point.spaceId}`}
      variant='image'
      baseWidth={SOLAR_BOARD_BASE_SIZE_PX}
      baseHeight={SOLAR_BOARD_BASE_SIZE_PX}
      x={(point.xPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
      y={(point.yPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
      width={widthPx / boardScale}
      height={heightPx / boardScale}
      offsetX={offsetX}
      offsetY={offsetY}
      shape='rect'
      color='#a78bfa'
      debugLabel={`Oumuamua planet ${point.spaceId}`}
      testId={`solar-oumuamua-planet-${point.spaceId}`}
      style={{ zIndex: 78 }}
    >
      <img
        src='/assets/seti/aliens/oumuamua/planet.webp'
        alt='Oumuamua'
        className='h-full w-full select-none'
        draggable={false}
        style={{
          imageRendering: 'auto',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))',
          transform: `rotate(${
            point.rotationDeg +
            OUMUAMUA_PLANET_BASE_ROTATION_DEG +
            calibration.rotationOffset
          }deg)`,
          transformOrigin: 'center',
        }}
      />
    </HotspotAnchor>
  );
}

/**
 * Where the 3-data pill sits relative to the tile centre.
 *
 * - text mode: placed straight up from the tile (legacy debug behaviour),
 *   clear of any other markers so it's easy to verify capacity at a glance.
 * - image mode: overlaid roughly on the printed 1/2/3 circles. Iterate
 *   visually with `?oumT=…&oumR=…` URL params (shared with the planet
 *   art's calibration knobs) before locking in.
 */
const OUMUAMUA_DATA_PILL_BASE_OFFSET = {
  textMode: { tangentialPx: 44, radialPx: -18, rotationDeg: 14 },
  imageMode: { tangentialPx: 25, radialPx: -1, rotationDeg: 5 },
} as const;

function getOumuamuaDataPillPlacement({
  rotationDeg,
  textMode,
  boardScale,
  calibration,
}: {
  rotationDeg: number;
  textMode: boolean;
  boardScale: number;
  calibration: IOumuamuaDataPillCalibration;
}): { offsetX: number; offsetY: number; rotationDeg: number } {
  // Tangential = perpendicular to the radial axis at the tile (positive =
  // clockwise around the sun). Radial = away from the sun (positive).
  // Convert pixel offsets to viewport x/y deltas using the tile angle.
  const baseOffset = textMode
    ? OUMUAMUA_DATA_PILL_BASE_OFFSET.textMode
    : OUMUAMUA_DATA_PILL_BASE_OFFSET.imageMode;
  const angleRad = (rotationDeg * Math.PI) / 180;
  const tangentialPx =
    (baseOffset.tangentialPx + calibration.offsetT) * boardScale;
  const radialPx = (baseOffset.radialPx + calibration.offsetR) * boardScale;
  const tangentX = Math.cos(angleRad) * tangentialPx;
  const tangentY = Math.sin(angleRad) * tangentialPx;
  const radialX = Math.sin(angleRad) * radialPx;
  const radialY = -Math.cos(angleRad) * radialPx;

  return {
    offsetX: tangentX + radialX,
    offsetY: tangentY + radialY,
    rotationDeg: rotationDeg + baseOffset.rotationDeg + calibration.rotation,
  };
}

function getOumuamuaTextCellOffset(
  rotationDeg: number,
  boardScale: number,
  calibration: IOumuamuaDataPillCalibration,
): { x: number; y: number } {
  const dataPillPlacement = getOumuamuaDataPillPlacement({
    rotationDeg,
    textMode: true,
    boardScale,
    calibration,
  });

  return { x: dataPillPlacement.offsetX, y: 0 };
}

/**
 * Arc geometry for the 3 data dots in image mode. Mirrors the per-tile
 * sector data slots in `SectorNodeView` so dot size/curvature match the
 * rest of the board. Both fields are *base* px values — the renderer
 * multiplies them by `boardScale` so the arc shrinks/grows with zoom.
 */
const OUMUAMUA_DATA_ARC_DEFAULT = {
  /** Distance from the dot wrapper to the arc's centre of curvature, in px. */
  radiusPx: 300,
  /** Diameter of each dot in px. Adjacent dots touch (no gap). */
  dotDiameterPx: 22.8,
} as const;

function OumuamuaSectorDataList({
  point,
  tile,
  signals,
  playerColors,
  textMode,
  boardScale = 1,
  calibration,
}: {
  point: ISpacePoint;
  tile: IPublicOumuamuaTile;
  signals: IPublicSectorSignal[];
  playerColors: Record<string, string>;
  textMode: boolean;
  boardScale?: number;
  calibration: IOumuamuaDataPillCalibration;
}): React.JSX.Element {
  const {
    offsetX,
    offsetY,
    rotationDeg: pillRotation,
  } = getOumuamuaDataPillPlacement({
    rotationDeg: point.rotationDeg,
    textMode,
    boardScale,
    calibration,
  });

  // Scale the arc geometry by zoom so dots stay the same visual size as
  // the regular per-tile sector data dots (which apply the same scale
  // in `SectorNodeView`).
  const scaledArc = {
    radiusPx: OUMUAMUA_DATA_ARC_DEFAULT.radiusPx * boardScale,
    dotDiameterPx: OUMUAMUA_DATA_ARC_DEFAULT.dotDiameterPx * boardScale,
  };

  return (
    <HotspotAnchor
      sceneId='solar-system'
      hotspotId={`oumuamua-sector-data-${point.spaceId}`}
      variant={textMode ? 'text' : 'image'}
      baseWidth={SOLAR_BOARD_BASE_SIZE_PX}
      baseHeight={SOLAR_BOARD_BASE_SIZE_PX}
      x={(point.xPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
      y={(point.yPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
      width={96}
      height={44}
      offsetX={offsetX}
      offsetY={offsetY}
      shape='rect'
      color='#67e8f9'
      debugLabel={`Oumuamua sector data ${tile.sectorId}`}
      testId={`solar-oumuamua-sector-${point.spaceId}`}
      style={{ zIndex: 86 }}
      title={`Oumuamua sector ${tile.sectorId}`}
    >
      <div
        className={cn(
          'absolute left-1/2 top-1/2',
          textMode
            ? 'flex items-center gap-[2px] rounded-full border border-white/75 bg-surface-950/90 px-1 py-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.55)]'
            : 'pointer-events-none',
        )}
        style={{
          transform: `translate(-50%, -50%) rotate(${pillRotation}deg)`,
          transformOrigin: 'center',
          // Arc-mode children position absolutely; give them a frame so the
          // outer translate above stays the anchor point.
          ...(textMode ? {} : { width: 0, height: 0, position: 'relative' }),
        }}
        data-testid='solar-oumuamua-data-list'
        data-sector-id={tile.sectorId}
      >
        <SectorSignalList
          signals={signals}
          capacity={OUMUAMUA_TILE_DATA_CAPACITY}
          playerColors={playerColors}
          textMode={textMode}
          slotTestIdPrefix='solar-oumuamua-data-slot'
          arc={textMode ? undefined : scaledArc}
        />
      </div>
    </HotspotAnchor>
  );
}

/**
 * Map (trace color, headline reward type) to the printed token art file.
 * The printed Anomalies tokens come in 6 fixed combos: pink+credit/VP,
 * yellow+card/publicity, blue+data/energy. Returns null if the rewards
 * don't fit any of those combos (in which case we fall back to the
 * earlier pill UI rendering).
 */
function resolveAnomalyTokenArtSrc(
  token: IPublicSolarSystemAlienToken,
): string | null {
  // Pull the headline reward — for Anomalies tokens this is the first
  // entry in the rewards array (the others, if any, are the bonus track).
  const headline = token.rewards.find(
    (r) =>
      r.type === 'CREDIT' ||
      r.type === 'VP' ||
      r.type === 'CARD' ||
      r.type === 'CARD_ANY' ||
      r.type === 'PUBLICITY' ||
      r.type === 'DATA' ||
      r.type === 'ENERGY',
  );
  if (!headline) return null;

  const base = '/assets/seti/aliens/anomalies/tokens';
  if (token.traceColor === ETrace.PINK) {
    if (headline.type === 'CREDIT') return `${base}/pink-credit.png`;
    if (headline.type === 'VP') return `${base}/pink-vp.png`;
  } else if (token.traceColor === ETrace.YELLOW) {
    // YELLOW's printed "card" face is row-or-deck choice (CARD_ANY).
    // Treat the legacy CARD value the same way so older saves and
    // tests still resolve to the correct art.
    if (headline.type === 'CARD' || headline.type === 'CARD_ANY') {
      return `${base}/yellow-card.png`;
    }
    if (headline.type === 'PUBLICITY') return `${base}/yellow-publicity.png`;
  } else if (token.traceColor === ETrace.BLUE) {
    if (headline.type === 'DATA') return `${base}/blue-data.png`;
    if (headline.type === 'ENERGY') return `${base}/blue-energy.png`;
  }
  return null;
}

// Slide the token tangentially along its orbital arc (same radius from the
// sun) so it doesn't sit on top of any planet/comet painted at the sector
// centre. Stacking offsets via `offsetX`/`offsetY` still apply on top.
const ALIEN_TOKEN_TANGENTIAL_OFFSET_PX = 35;

function SolarAlienTokenMarker({
  token,
  xPercent,
  yPercent,
  offsetX,
  offsetY,
  textMode,
}: {
  token: IPublicSolarSystemAlienToken;
  xPercent: number;
  yPercent: number;
  offsetX: number;
  offsetY: number;
  textMode: boolean;
}): React.JSX.Element {
  const color = SOLAR_ALIEN_TOKEN_COLOR[token.traceColor];
  const artSrc = resolveAnomalyTokenArtSrc(token);

  // Slide each token along the orbit (perpendicular to the radius from
  // the sun at 50%/50%) so the planet/comet painted in the middle of
  // the sector stays visible. Same orbital radius — only tangential.
  const dx = xPercent - 50;
  const dy = yPercent - 50;
  const len = Math.hypot(dx, dy) || 1;
  // Rotate (dx, dy) by 90° to get the tangent. Choosing (-dy, dx) keeps
  // tokens going counter-clockwise around the sun, which matches the
  // direction the printed art's end-cap faces.
  const tangentX = (-dy / len) * ALIEN_TOKEN_TANGENTIAL_OFFSET_PX;
  const tangentY = (dx / len) * ALIEN_TOKEN_TANGENTIAL_OFFSET_PX;

  if (artSrc) {
    return (
      <HotspotAnchor
        sceneId='solar-system'
        hotspotId={`alien-token-${token.tokenId}`}
        variant={textMode ? 'text' : 'image'}
        baseWidth={SOLAR_BOARD_BASE_SIZE_PX}
        baseHeight={SOLAR_BOARD_BASE_SIZE_PX}
        x={(xPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
        y={(yPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
        width={54}
        height={36}
        offsetX={offsetX + tangentX}
        offsetY={offsetY + tangentY}
        color={color}
        debugLabel={`solar alien token ${token.tokenId}`}
        style={{ zIndex: 78 }}
        testId={`solar-alien-token-${token.alienType}-${token.sectorIndex}-${token.traceColor}`}
        title={token.tokenId}
      >
        <img
          src={artSrc}
          alt=''
          aria-hidden
          className='block h-9 w-auto select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]'
          draggable={false}
        />
      </HotspotAnchor>
    );
  }

  return (
    <HotspotAnchor
      sceneId='solar-system'
      hotspotId={`alien-token-${token.tokenId}`}
      variant={textMode ? 'text' : 'image'}
      baseWidth={SOLAR_BOARD_BASE_SIZE_PX}
      baseHeight={SOLAR_BOARD_BASE_SIZE_PX}
      x={(xPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
      y={(yPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
      width={56}
      height={28}
      offsetX={offsetX + tangentX}
      offsetY={offsetY + tangentY}
      color={color}
      debugLabel={`solar alien token ${token.tokenId}`}
      className='inline-flex min-w-14 items-center overflow-hidden rounded-full'
      style={{
        zIndex: 78,
        boxShadow: `0 0 0 1px ${color}, 0 2px 6px rgba(0,0,0,0.55)`,
      }}
      testId={`solar-alien-token-${token.alienType}-${token.sectorIndex}-${token.traceColor}`}
      title={token.tokenId}
    >
      <span className='flex h-full w-full overflow-hidden rounded-full border border-surface-100/60 bg-surface-950/95 shadow-[0_2px_6px_rgba(0,0,0,0.55)]'>
        <span
          className='h-full w-2.5 shrink-0'
          data-testid='solar-alien-token-trace-color-left'
          style={{ backgroundColor: color }}
        />
        <span className='flex min-w-8 items-center justify-center px-1.5'>
          <SolarAlienTokenRewardIcons rewards={token.rewards} />
        </span>
        <span
          className='h-full w-2.5 shrink-0'
          data-testid='solar-alien-token-trace-color-right'
          style={{ backgroundColor: color }}
        />
      </span>
    </HotspotAnchor>
  );
}

function SolarGlyphidsSectorTokenMarker({
  token,
  xPercent,
  yPercent,
  offsetX,
  offsetY,
  textMode,
}: {
  token: IPublicSolarSystemGlyphidsSectorToken;
  xPercent: number;
  yPercent: number;
  offsetX: number;
  offsetY: number;
  textMode: boolean;
}): React.JSX.Element {
  return (
    <HotspotAnchor
      sceneId='solar-system'
      hotspotId={`glyphids-sector-token-${token.tokenId}`}
      variant={textMode ? 'text' : 'image'}
      baseWidth={SOLAR_BOARD_BASE_SIZE_PX}
      baseHeight={SOLAR_BOARD_BASE_SIZE_PX}
      x={(xPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
      y={(yPercent * SOLAR_BOARD_BASE_SIZE_PX) / 100}
      width={28}
      height={28}
      offsetX={offsetX}
      offsetY={offsetY}
      color='#bef264'
      debugLabel={`solar glyphids sector token ${token.tokenId}`}
      className='inline-flex items-center justify-center rounded-full'
      style={{ zIndex: 79 }}
      testId={`solar-glyphids-sector-token-${token.tokenId}`}
      title={token.tokenId}
    >
      <span className='inline-flex h-full w-full items-center justify-center rounded-full border border-lime-200/70 bg-surface-950/95 shadow-[0_2px_6px_rgba(0,0,0,0.55)]'>
        <DescRender desc={`{${token.glyph}[sm]}`} size='desc-mini' smartSize />
      </span>
    </HotspotAnchor>
  );
}

function SolarAlienTokenRewardIcons({
  rewards,
}: {
  rewards: readonly TPublicSlotReward[];
}): React.JSX.Element {
  const presentations = toTraceRewardPresentations(rewards);

  return (
    <span className='flex items-center justify-center gap-0.5'>
      {presentations.map((presentation, index) => (
        <SolarAlienTokenRewardIcon
          key={`${presentation.token}-${index}`}
          presentation={presentation}
        />
      ))}
    </span>
  );
}

function SolarAlienTokenRewardIcon({
  presentation,
}: {
  presentation: TTraceRewardPresentation;
}): React.JSX.Element {
  const testKey = presentation.token.replace(/[{}]/g, '');

  if (presentation.kind === 'text') {
    return (
      <span
        className='max-w-7 truncate font-mono text-[8px] font-bold uppercase leading-none text-text-100'
        data-testid={`trace-reward-icon-${testKey}`}
        title={presentation.label}
      >
        {presentation.text}
      </span>
    );
  }

  return (
    <span
      className='inline-flex h-5 w-5 items-center justify-center overflow-visible'
      data-testid={`trace-reward-icon-${testKey}`}
      title={presentation.label}
    >
      <DescRender desc={presentation.token} size='desc-mini' smartSize />
    </span>
  );
}

function CapsuleToken({
  playerColor,
}: {
  playerColor: string;
}): React.JSX.Element {
  return (
    <span
      className='flex h-5 w-5 items-center justify-center rounded-full border-2 border-text-100/80 bg-surface-950/85 font-mono text-[9px] font-bold leading-none text-text-100 shadow-[0_0_0_1px_rgba(0,0,0,0.7),0_2px_6px_rgba(0,0,0,0.55)]'
      style={{
        boxShadow: `0 0 0 2px ${playerColor}, 0 2px 6px rgba(0,0,0,0.55)`,
      }}
      title={`${playerColor} sample capsule`}
    >
      S
    </span>
  );
}
