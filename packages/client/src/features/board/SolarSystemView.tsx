import { OUMUAMUA_TILE_DATA_CAPACITY } from '@seti/common/constant/alienBoardConfig';
import type {
  ISolarSystemSetupConfig,
  ISolarSystemWheelMapCell,
  TSolarSystemWheelIndex,
} from '@seti/common/constant/sectorSetup';
import {
  cellInSectorOf,
  coordinateFromSpaceId,
  SECTOR_COUNT,
  sectorIndexOf,
} from '@seti/common/constant/solarCoordinate';
import {
  getReachableSpaces,
  resolveTopVisibleSolarWheelCell,
} from '@seti/common/rules';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import type {
  IInputResponse,
  IPlayerInputModel,
  IPublicOumuamuaTile,
  IPublicSector,
  IPublicSectorSignal,
  IPublicSolarSystem,
  IPublicSolarSystemAlienToken,
} from '@/types/re-exports';
import { EAlienType, EPlayerInputType, ETrace } from '@/types/re-exports';
import { ProbeToken } from './ProbeToken';
import { SectorGrid } from './SectorGrid';
import { SectorSignalList } from './SectorSignalList';
import { WheelLayer } from './WheelLayer';

const WHEEL_RENDER_SIZE_PERCENT = [34, 48, 62, 100] as const;
const WHEEL_IMAGE_SIZE_PX = [397, 548, 702, 1125] as const;
const DEFAULT_PROBE_INSET_PX_BY_RING: Readonly<Record<1 | 2 | 3 | 4, number>> =
  {
    1: 89,
    2: 95,
    3: 91,
    4: 229,
  };
const IMAGE_ALIGNMENT_OFFSET_CW_BY_RING: Readonly<
  Record<1 | 2 | 3 | 4, number>
> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
};
const PROBE_TRANSITION_MS = 900;
const SOLAR_ALIEN_TOKEN_COLOR: Record<
  ETrace.RED | ETrace.YELLOW | ETrace.BLUE,
  string
> = {
  [ETrace.RED]: '#e93e27',
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
export type TProbeInsetPxByRing = Readonly<Record<1 | 2 | 3 | 4, number>>;

interface ISolarSystemViewProps {
  solarSystem: IPublicSolarSystem;
  sectors: IPublicSector[];
  setupConfig: ISolarSystemSetupConfig;
  pendingInput: IPlayerInputModel | null;
  playerColors: Record<string, string>;
  myPlayerId: string;
  movementPoints?: number;
  moveModeActive?: boolean;
  onMoveProbe: (path: string[]) => void;
  onRespondInput: (response: IInputResponse) => void;
  showSpaceConfigDebug?: boolean;
  probeInsetPxByRing?: TProbeInsetPxByRing;
  allowMoveAnyProbe?: boolean;
  oumuamuaTile?: IPublicOumuamuaTile | null;
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

interface IProbeRenderItem {
  key: string;
  playerId: string;
  xPercent: number;
  yPercent: number;
  offsetX: number;
  offsetY: number;
  transitionDelayMs: number;
}

interface ISolarAlienTokenRenderItem {
  key: string;
  token: IPublicSolarSystemAlienToken;
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

function spacePosition(
  ringIndex: 1 | 2 | 3 | 4,
  sectorIndex: number,
  cellInSector: number,
  cellsPerSector: number,
  spaceRadiiPercent: readonly number[],
  discAngle: number,
): { xPercent: number; yPercent: number; rotationDeg: number } {
  const safeCellsPerSector = Math.max(1, cellsPerSector);
  const normalizedSectorIndex =
    ((sectorIndex % SECTOR_COUNT) + SECTOR_COUNT) % SECTOR_COUNT;
  const normalizedCellInSector =
    ((cellInSector % safeCellsPerSector) + safeCellsPerSector) %
    safeCellsPerSector;
  const cellAngleDeg = 45 / safeCellsPerSector;
  const imageOffset = IMAGE_ALIGNMENT_OFFSET_CW_BY_RING[ringIndex] ?? 0;
  // WheelLayer renders disc angle N as rotate(-N * 45deg), so hotspots must
  // apply the same visual rotation direction as the wheel image.
  const rotationDeg = normalizeAngleDeg(
    (normalizedSectorIndex * safeCellsPerSector +
      normalizedCellInSector +
      0.5) *
      cellAngleDeg +
      imageOffset * 45 -
      discAngle * 45,
  );
  const radius = spaceRadiiPercent[ringIndex - 1] ?? spaceRadiiPercent[0] ?? 0;
  const angle = (rotationDeg * Math.PI) / 180;
  return {
    xPercent: 50 + Math.sin(angle) * radius,
    yPercent: 50 - Math.cos(angle) * radius,
    rotationDeg,
  };
}

function getDiscAngle(
  solarSystem: IPublicSolarSystem,
  ring: 1 | 2 | 3,
): number {
  const disc = solarSystem.discs.find((d) => d.discIndex === ring - 1);
  return disc?.angle ?? 0;
}

function isExpandedServerRingIndex(
  state: { ringIndex: number; indexInRing: number },
  usesZeroBasedRingIndex: boolean,
): boolean {
  const rawRingIndex = usesZeroBasedRingIndex
    ? state.ringIndex + 1
    : state.ringIndex;
  const ringIndex = normalizeRingIndex(rawRingIndex);
  return Boolean(ringIndex && ringIndex > 1 && state.indexInRing >= 8);
}

function getTextModeCellLabel(
  cell: ISolarSystemWheelMapCell,
): ITextModeSpaceLabel | null {
  if (cell.type === 'NULL') {
    return null;
  }

  if (cell.type === 'EMPTY') {
    return { label: '', kind: 'empty' };
  }

  if (cell.type === 'EARTH') {
    return { label: 'earth', kind: 'earth' };
  }

  if (cell.type === 'PLANET' && cell.planet) {
    return { label: cell.planet.toLowerCase(), kind: 'planet' };
  }

  if (cell.type === 'ASTEROID') {
    return { label: 'asteroid', kind: 'asteroid' };
  }

  if (cell.type === 'COMET') {
    return { label: 'comet', kind: 'comet' };
  }

  return { label: cell.type.toLowerCase(), kind: 'other' };
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

function textModeCellPosition(
  ringIndex: 1 | 2 | 3 | 4,
  visualIndexInRing: number,
  spaceRadiiPercent: readonly number[],
): { xPercent: number; yPercent: number; rotationDeg: number } {
  return spacePosition(
    ringIndex,
    visualIndexInRing,
    0,
    1,
    spaceRadiiPercent,
    0,
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
  probeInsetPxByRing,
  allowMoveAnyProbe = false,
  oumuamuaTile = null,
}: ISolarSystemViewProps): React.JSX.Element {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const textMode = useTextMode();

  const spaceRadiiPercent = useMemo(() => {
    const insets = probeInsetPxByRing ?? DEFAULT_PROBE_INSET_PX_BY_RING;
    return WHEEL_RENDER_SIZE_PERCENT.map((wheelSizePercent, ringOffset) => {
      const ring = (ringOffset + 1) as 1 | 2 | 3 | 4;
      const imageSizePx =
        WHEEL_IMAGE_SIZE_PX[ringOffset] ?? WHEEL_IMAGE_SIZE_PX[0];
      const insetPx = insets[ring] ?? DEFAULT_PROBE_INSET_PX_BY_RING[ring];
      const outerRadiusPercent = wheelSizePercent / 2;
      const insetPercent = wheelSizePercent * (insetPx / imageSizePx);
      return Math.max(0, outerRadiusPercent - insetPercent);
    }) as [number, number, number, number];
  }, [probeInsetPxByRing]);

  const discAngleByRing = useMemo<Record<1 | 2 | 3 | 4, number>>(() => {
    const byDisc = new Map(
      solarSystem.discs.map((d) => [d.discIndex, d.angle]),
    );
    return {
      1: byDisc.get(0) ?? 0,
      2: byDisc.get(1) ?? 0,
      3: byDisc.get(2) ?? 0,
      4: 0,
    };
  }, [solarSystem.discs]);

  const spacePoints = useMemo<ISpacePoint[]>(() => {
    const states = solarSystem.spaceStates;
    const usesZeroBasedRingIndex = Boolean(
      states && Object.values(states).some((state) => state.ringIndex === 0),
    );
    const usesExpandedRingIndexes = Boolean(
      states &&
        Object.values(states).some((state) =>
          isExpandedServerRingIndex(state, usesZeroBasedRingIndex),
        ),
    );

    return solarSystem.spaces.map((spaceId, idx) => {
      const state = states?.[spaceId];
      const fallbackRing = (Math.floor(idx / 8) + 1) as 1 | 2 | 3 | 4;
      const fallbackIndexInRing = idx % 8;

      let ringIndex = fallbackRing;
      let indexInRing = fallbackIndexInRing;
      let sectorIndex = fallbackIndexInRing;
      let cellInSector = 0;
      let cellsPerSector = 1;
      let isStateBackedPosition = false;

      if (state) {
        const rawRingIndex = usesZeroBasedRingIndex
          ? state.ringIndex + 1
          : state.ringIndex;
        const normalizedRingIndex = normalizeRingIndex(rawRingIndex);
        if (normalizedRingIndex) {
          ringIndex = normalizedRingIndex;
          indexInRing = state.indexInRing;
          if (usesExpandedRingIndexes) {
            sectorIndex =
              state.sectorIndex ??
              sectorIndexOf(normalizedRingIndex, state.indexInRing);
            cellInSector =
              state.cellInSector ??
              cellInSectorOf(normalizedRingIndex, state.indexInRing);
            cellsPerSector = normalizedRingIndex;
          } else {
            sectorIndex = ((state.indexInRing % 8) + 8) % 8;
          }
          isStateBackedPosition = true;
        }
      } else {
        const coord = coordinateFromSpaceId(spaceId);
        if (coord) {
          ringIndex = coord.ringIndex;
          indexInRing = coord.indexInRing;
          sectorIndex = coord.sectorIndex;
          cellInSector = coord.cellInSector;
          cellsPerSector = coord.ringIndex;
          isStateBackedPosition = true;
        }
      }

      if (textMode) {
        cellInSector = 0;
        cellsPerSector = 1;
      }

      const discAngle = isStateBackedPosition ? 0 : discAngleByRing[ringIndex];
      const pos = spacePosition(
        ringIndex,
        sectorIndex,
        cellInSector,
        cellsPerSector,
        spaceRadiiPercent,
        discAngle,
      );
      return {
        spaceId,
        ringIndex,
        indexInRing,
        sectorIndex,
        cellInSector,
        visualIndexInRing: sectorIndex * cellsPerSector + cellInSector,
        ...pos,
      };
    });
  }, [
    solarSystem.spaces,
    solarSystem.spaceStates,
    spaceRadiiPercent,
    discAngleByRing,
    textMode,
  ]);

  const debugLabelsBySpaceId = useMemo(() => {
    if (!showSpaceConfigDebug) {
      return undefined;
    }

    const labels: Record<string, string> = {};
    for (const space of spacePoints) {
      const state = solarSystem.spaceStates?.[space.spaceId];
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

    const discAngles = [
      discAngleByRing[1],
      discAngleByRing[2],
      discAngleByRing[3],
    ];
    const items: ITextModeLabelItem[] = [];

    for (let bandIndex = 0; bandIndex < 4; bandIndex += 1) {
      const boardRing = (bandIndex + 1) as 1 | 2 | 3 | 4;
      for (let boardIndex = 0; boardIndex < 8; boardIndex += 1) {
        const visible = resolveTopVisibleSolarWheelCell(
          setupConfig.wheels,
          bandIndex,
          boardIndex,
          discAngles,
        );
        if (!visible) {
          continue;
        }

        const label = getTextModeCellLabel(visible.cell.cell);
        if (!label) {
          continue;
        }

        const labelPosition = textModeCellPosition(
          boardRing,
          boardIndex,
          spaceRadiiPercent,
        );
        items.push({
          key: `${visible.wheel}:${bandIndex}:${boardIndex}`,
          label,
          styleLayer: visible.wheel,
          ...labelPosition,
        });
      }
    }

    return items;
  }, [textMode, setupConfig.wheels, discAngleByRing, spaceRadiiPercent]);

  const probeView = useMemo(() => {
    const bySpacePlayers: Record<string, string[]> = {};
    const spacePointById = new Map(
      spacePoints.map((point) => [point.spaceId, point]),
    );
    const playerOccurrence: Record<string, number> = {};
    const grouped: Record<
      string,
      Array<{ key: string; playerId: string; transitionDelayMs: number }>
    > = {};

    for (const probe of solarSystem.probes) {
      if (!bySpacePlayers[probe.spaceId]) {
        bySpacePlayers[probe.spaceId] = [];
      }
      bySpacePlayers[probe.spaceId].push(probe.playerId);

      const occurrence = playerOccurrence[probe.playerId] ?? 0;
      playerOccurrence[probe.playerId] = occurrence + 1;
      const key = probe.probeId ?? `${probe.playerId}-${occurrence}`;

      if (!grouped[probe.spaceId]) {
        grouped[probe.spaceId] = [];
      }
      grouped[probe.spaceId].push({
        key,
        playerId: probe.playerId,
        transitionDelayMs: probe.transitionDelayMs ?? 0,
      });
    }

    const renderItems: IProbeRenderItem[] = [];
    for (const [spaceId, probes] of Object.entries(grouped)) {
      const point = spacePointById.get(spaceId);
      if (!point) {
        continue;
      }

      for (let index = 0; index < probes.length; index += 1) {
        const probe = probes[index];
        const offset = tokenStackOffset(index, probes.length);
        renderItems.push({
          key: probe.key,
          playerId: probe.playerId,
          xPercent: point.xPercent,
          yPercent: point.yPercent,
          offsetX: offset.x,
          offsetY: offset.y,
          transitionDelayMs: probe.transitionDelayMs,
        });
      }
    }

    return { bySpacePlayers, renderItems };
  }, [solarSystem.probes, spacePoints]);

  const solarAlienTokenView = useMemo<ISolarAlienTokenRenderItem[]>(() => {
    const groupedBySector = new Map<number, IPublicSolarSystemAlienToken[]>();
    for (const token of solarSystem.alienTokens) {
      const tokens = groupedBySector.get(token.sectorIndex) ?? [];
      tokens.push(token);
      groupedBySector.set(token.sectorIndex, tokens);
    }

    const items: ISolarAlienTokenRenderItem[] = [];
    for (const [sectorIndex, tokens] of groupedBySector.entries()) {
      const position = spacePosition(
        4,
        sectorIndex,
        0,
        1,
        spaceRadiiPercent,
        0,
      );
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
  }, [solarSystem.alienTokens, spaceRadiiPercent]);

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

  const reachablePathBySpaceId = useMemo(() => {
    if (!selectedSpaceId || movementPoints <= 0) {
      return new Map<string, string[]>();
    }
    return new Map(
      getReachableSpaces(solarSystem, selectedSpaceId, movementPoints).map(
        (entry) => [entry.spaceId, entry.path] as const,
      ),
    );
  }, [selectedSpaceId, movementPoints, solarSystem]);

  const activeMovePathBySpaceId = useMemo(() => {
    if (!moveModeActive || movementPoints <= 0) {
      return new Map<string, { movementCost: number; path: string[] }>();
    }

    const paths = new Map<string, { movementCost: number; path: string[] }>();
    for (const probe of solarSystem.probes) {
      if (!allowMoveAnyProbe && probe.playerId !== myPlayerId) {
        continue;
      }

      for (const reachableSpace of getReachableSpaces(
        solarSystem,
        probe.spaceId,
        movementPoints,
      )) {
        const known = paths.get(reachableSpace.spaceId);
        if (known && known.movementCost <= reachableSpace.movementCost) {
          continue;
        }
        paths.set(reachableSpace.spaceId, {
          movementCost: reachableSpace.movementCost,
          path: reachableSpace.path,
        });
      }
    }

    return paths;
  }, [
    allowMoveAnyProbe,
    moveModeActive,
    movementPoints,
    myPlayerId,
    solarSystem,
  ]);

  const visibleReachablePathBySpaceId = useMemo(() => {
    if (selectedSpaceId) {
      return reachablePathBySpaceId;
    }

    if (!moveModeActive) {
      return new Map<string, string[]>();
    }

    return new Map(
      [...activeMovePathBySpaceId.entries()].map(
        ([spaceId, entry]) => [spaceId, entry.path] as const,
      ),
    );
  }, [
    activeMovePathBySpaceId,
    moveModeActive,
    reachablePathBySpaceId,
    selectedSpaceId,
  ]);

  const reachable = useMemo(
    () => new Set(visibleReachablePathBySpaceId.keys()),
    [visibleReachablePathBySpaceId],
  );

  function handleSpaceClick(spaceId: string): void {
    const activeMovePath = visibleReachablePathBySpaceId.get(spaceId);
    if (activeMovePath) {
      onMoveProbe(activeMovePath);
      setSelectedSpaceId(moveModeActive ? null : spaceId);
      return;
    }

    const hasMyProbe = (probeView.bySpacePlayers[spaceId] ?? []).includes(
      myPlayerId,
    );
    const hasAnyProbe = (probeView.bySpacePlayers[spaceId] ?? []).length > 0;
    if (hasMyProbe || (allowMoveAnyProbe && hasAnyProbe)) {
      setSelectedSpaceId((prev) => (prev === spaceId ? null : spaceId));
      return;
    }

    if (selectedSpaceId) {
      const path = visibleReachablePathBySpaceId.get(spaceId);
      if (!path) {
        return;
      }
      onMoveProbe(path);
      setSelectedSpaceId(moveModeActive ? null : spaceId);
    }
  }

  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/30 p-3'>
      <header className='mb-2 flex items-center justify-between gap-3'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          Solar System
        </h2>
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
      </header>

      <div
        className='relative mx-auto aspect-square w-full max-w-[760px] overflow-hidden rounded-md'
        style={
          textMode
            ? { backgroundColor: 'rgba(8, 13, 25, 0.6)' }
            : {
                backgroundImage: 'url(/assets/seti/boards/background.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
        }
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
          <img
            src='/assets/seti/sun.png'
            alt=''
            aria-hidden
            className='pointer-events-none absolute left-1/2 top-1/2 z-50 w-[10%] -translate-x-1/2 -translate-y-1/2 select-none'
            style={{ animation: 'spin 1800s linear infinite' }}
            draggable={false}
          />
        )}

        <SectorGrid
          sectors={sectors}
          setupConfig={setupConfig}
          playerColors={playerColors}
          pendingInput={pendingInput}
          onSelectSector={(sectorColor) => {
            if (pendingInput?.type !== EPlayerInputType.SECTOR) {
              return;
            }
            onRespondInput({
              type: EPlayerInputType.SECTOR,
              sector: sectorColor,
            });
          }}
          onSelectSectorId={(sectorId) => {
            if (pendingInput?.type !== EPlayerInputType.OPTION) {
              return;
            }
            onRespondInput({
              type: EPlayerInputType.OPTION,
              optionId: sectorId,
            });
          }}
        />

        {spacePoints.map((space) => {
          const probeCount =
            probeView.bySpacePlayers[space.spaceId]?.length ?? 0;
          const hasMyProbe = (
            probeView.bySpacePlayers[space.spaceId] ?? []
          ).includes(myPlayerId);
          const isSelected = selectedSpaceId === space.spaceId;
          const isReachable = reachable.has(space.spaceId);

          return (
            <button
              key={space.spaceId}
              type='button'
              data-testid={`solar-space-${space.spaceId}`}
              className='absolute z-70 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-transparent bg-transparent transition-all hover:border-accent-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/60'
              style={{
                left: `${space.xPercent}%`,
                top: `${space.yPercent}%`,
              }}
              onClick={() => handleSpaceClick(space.spaceId)}
              title={`${space.spaceId} - probes: ${probeCount}`}
              aria-label={`Space ${space.spaceId}`}
            >
              {(isSelected || isReachable || hasMyProbe) && (
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
            </button>
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
                  transform: 'translate(-50%, -50%)',
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
          <OumuamuaSectorDataList
            point={oumuamuaSectorData.point}
            tile={oumuamuaSectorData.tile}
            signals={oumuamuaSectorData.signals}
            playerColors={playerColors}
            textMode={textMode}
          />
        ) : null}

        {solarAlienTokenView.map((item) => (
          <SolarAlienTokenMarker
            key={item.key}
            token={item.token}
            xPercent={item.xPercent}
            yPercent={item.yPercent}
            offsetX={item.offsetX}
            offsetY={item.offsetY}
          />
        ))}

        {probeView.renderItems.map((probe) => (
          <div
            key={probe.key}
            className='pointer-events-none absolute z-80 h-6 w-6'
            style={{
              left: `${probe.xPercent}%`,
              top: `${probe.yPercent}%`,
              transform: `translate(calc(-50% + ${probe.offsetX}px), calc(-50% + ${probe.offsetY}px))`,
              transition: `left ${PROBE_TRANSITION_MS}ms ease-out, top ${PROBE_TRANSITION_MS}ms ease-out, transform ${PROBE_TRANSITION_MS}ms ease-out`,
              transitionDelay:
                probe.transitionDelayMs > 0
                  ? `${probe.transitionDelayMs}ms`
                  : undefined,
            }}
          >
            <ProbeToken playerColor={playerColors[probe.playerId] ?? 'white'} />
          </div>
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

function OumuamuaSectorDataList({
  point,
  tile,
  signals,
  playerColors,
  textMode,
}: {
  point: ISpacePoint;
  tile: IPublicOumuamuaTile;
  signals: IPublicSectorSignal[];
  playerColors: Record<string, string>;
  textMode: boolean;
}): React.JSX.Element {
  return (
    <div
      className='pointer-events-none absolute h-0 w-0'
      data-testid={`solar-oumuamua-sector-${point.spaceId}`}
      style={{
        left: `${point.xPercent}%`,
        top: `${point.yPercent}%`,
        transform: `rotate(${point.rotationDeg}deg)`,
        transformOrigin: 'center',
        zIndex: 86,
      }}
      title={`Oumuamua sector ${tile.sectorId}`}
    >
      <div
        className={cn(
          'absolute left-1/2 top-0 flex items-center gap-[2px] rounded-full border bg-surface-950/90 shadow-[0_2px_8px_rgba(0,0,0,0.55)]',
          textMode
            ? 'border-white/75 px-1 py-0.5'
            : 'border-cyan-100/75 px-1.5 py-1',
        )}
        style={{ transform: 'translate(-50%, calc(-100% - 10px))' }}
        data-testid='solar-oumuamua-data-list'
        data-sector-id={tile.sectorId}
      >
        <SectorSignalList
          signals={signals}
          capacity={OUMUAMUA_TILE_DATA_CAPACITY}
          playerColors={playerColors}
          textMode={textMode}
          slotTestIdPrefix='solar-oumuamua-data-slot'
        />
      </div>
    </div>
  );
}

function SolarAlienTokenMarker({
  token,
  xPercent,
  yPercent,
  offsetX,
  offsetY,
}: {
  token: IPublicSolarSystemAlienToken;
  xPercent: number;
  yPercent: number;
  offsetX: number;
  offsetY: number;
}): React.JSX.Element {
  const color = SOLAR_ALIEN_TOKEN_COLOR[token.traceColor];
  const label = token.alienType === EAlienType.ANOMALIES ? 'A' : 'ET';

  return (
    <div
      className='pointer-events-none absolute flex h-7 w-7 items-center justify-center rounded-sm border border-surface-100/50 bg-surface-950/85 font-mono text-[10px] font-bold text-text-100 shadow-[0_2px_6px_rgba(0,0,0,0.55)]'
      data-testid={`solar-alien-token-${token.alienType}-${token.sectorIndex}-${token.traceColor}`}
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
        zIndex: 78,
        boxShadow: `0 0 0 2px ${color}66, 0 2px 6px rgba(0,0,0,0.55)`,
      }}
      title={token.tokenId}
    >
      <span
        className='absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-surface-100/50'
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}
