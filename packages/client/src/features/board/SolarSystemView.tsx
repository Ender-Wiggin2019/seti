import type {
  ISolarSystemSetupConfig,
  ISolarSystemWheelMapCell,
  TSolarSystemWheelIndex,
} from '@seti/common/constant/sectorSetup';
import {
  getReachableSpaces,
  getSolarWheelCellAtBoard,
} from '@seti/common/rules';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import type {
  IInputResponse,
  IPlayerInputModel,
  IPublicSector,
  IPublicSolarSystem,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { ProbeToken } from './ProbeToken';
import { SectorGrid } from './SectorGrid';
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
const TEXT_MODE_LABEL_Z_INDEX_BY_WHEEL: Readonly<
  Record<TSolarSystemWheelIndex, number>
> = {
  1: 75,
  2: 74,
  3: 73,
  4: 72,
};
const SOLAR_TEXT_WHEELS: ReadonlyArray<TSolarSystemWheelIndex> = [4, 3, 2, 1];

export type TProbeInsetPxByRing = Readonly<Record<1 | 2 | 3 | 4, number>>;

interface ISolarSystemViewProps {
  solarSystem: IPublicSolarSystem;
  sectors: IPublicSector[];
  setupConfig: ISolarSystemSetupConfig;
  pendingInput: IPlayerInputModel | null;
  playerColors: Record<string, string>;
  myPlayerId: string;
  movementPoints?: number;
  onMoveProbe: (path: string[]) => void;
  onRespondInput: (response: IInputResponse) => void;
  showSpaceConfigDebug?: boolean;
  probeInsetPxByRing?: TProbeInsetPxByRing;
  allowMoveAnyProbe?: boolean;
}

interface ISpacePoint {
  spaceId: string;
  ringIndex: 1 | 2 | 3 | 4;
  indexInRing: number;
  cellInSector: number;
  visualIndexInRing: number;
  xPercent: number;
  yPercent: number;
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

const TEXT_MODE_SPACE_STYLE_BY_RING: Readonly<
  Record<1 | 2 | 3 | 4, { borderColor: string; textColor: string }>
> = {
  1: { borderColor: 'rgba(255,255,255,0.96)', textColor: '#ffffff' },
  2: { borderColor: 'rgba(226,232,240,0.86)', textColor: '#e5e7eb' },
  3: { borderColor: 'rgba(156,163,175,0.78)', textColor: '#cbd5e1' },
  4: { borderColor: 'rgba(100,116,139,0.72)', textColor: '#94a3b8' },
};
const TEXT_MODE_LABEL_RADIUS_PERCENT_BY_RING: Readonly<
  Record<1 | 2 | 3 | 4, number>
> = {
  1: 12.4168,
  2: 19.272,
  3: 26.2756,
  4: 33.1,
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

function spacePosition(
  ringIndex: 1 | 2 | 3 | 4,
  indexInRing: number,
  spaceRadiiPercent: readonly number[],
  discAngle: number,
): { xPercent: number; yPercent: number } {
  const baseDirection = ((indexInRing % 8) + 8) % 8;
  const imageOffset = IMAGE_ALIGNMENT_OFFSET_CW_BY_RING[ringIndex] ?? 0;
  // WheelLayer renders disc angle N as rotate(-N * 45deg), so hotspots must
  // apply the same visual rotation direction as the wheel image.
  const direction = (((baseDirection + imageOffset - discAngle) % 8) + 8) % 8;
  const radius = spaceRadiiPercent[ringIndex - 1] ?? spaceRadiiPercent[0] ?? 0;
  const angle = (Math.PI / 4) * (direction + 0.5);
  return {
    xPercent: 50 + Math.sin(angle) * radius,
    yPercent: 50 - Math.cos(angle) * radius,
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

function textModeCellPosition(
  ringIndex: 1 | 2 | 3 | 4,
  visualIndexInRing: number,
): { xPercent: number; yPercent: number; rotationDeg: number } {
  const rotationDeg = (visualIndexInRing + 0.5) * 45;
  const theta = (rotationDeg * Math.PI) / 180;
  const radius = TEXT_MODE_LABEL_RADIUS_PERCENT_BY_RING[ringIndex];
  return {
    xPercent: 50 + Math.sin(theta) * radius,
    yPercent: 50 - Math.cos(theta) * radius,
    rotationDeg,
  };
}

export function SolarSystemView({
  solarSystem,
  sectors,
  setupConfig,
  pendingInput,
  playerColors,
  myPlayerId,
  movementPoints = 0,
  onMoveProbe,
  onRespondInput,
  showSpaceConfigDebug = false,
  probeInsetPxByRing,
  allowMoveAnyProbe = false,
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
      let cellInSector = fallbackIndexInRing % fallbackRing;
      let positionIndexInRing = fallbackIndexInRing;
      let isStateBackedPosition = false;

      if (state) {
        const rawRingIndex = usesZeroBasedRingIndex
          ? state.ringIndex + 1
          : state.ringIndex;
        const normalizedRingIndex = normalizeRingIndex(rawRingIndex);
        if (normalizedRingIndex) {
          ringIndex = normalizedRingIndex;
          indexInRing = state.indexInRing;
          cellInSector = state.cellInSector ?? state.indexInRing % ringIndex;
          positionIndexInRing = usesExpandedRingIndexes
            ? Math.floor(state.indexInRing / normalizedRingIndex)
            : ((state.indexInRing % 8) + 8) % 8;
          isStateBackedPosition = true;
        }
      }

      const discAngle = isStateBackedPosition ? 0 : discAngleByRing[ringIndex];
      const pos = spacePosition(
        ringIndex,
        positionIndexInRing,
        spaceRadiiPercent,
        discAngle,
      );
      return {
        spaceId,
        ringIndex,
        indexInRing,
        cellInSector,
        visualIndexInRing: positionIndexInRing,
        ...pos,
      };
    });
  }, [
    solarSystem.spaces,
    solarSystem.spaceStates,
    spaceRadiiPercent,
    discAngleByRing,
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

  const textModeLabelItems = useMemo(() => {
    if (!textMode) {
      return [];
    }

    const discAngles = [
      discAngleByRing[1],
      discAngleByRing[2],
      discAngleByRing[3],
    ];
    const items: Array<{
      key: string;
      label: ITextModeSpaceLabel;
      wheel: TSolarSystemWheelIndex;
      boardRing: 1 | 2 | 3 | 4;
      boardIndex: number;
      xPercent: number;
      yPercent: number;
      rotationDeg: number;
    }> = [];

    for (const wheel of SOLAR_TEXT_WHEELS) {
      for (let bandIndex = 0; bandIndex < 4; bandIndex += 1) {
        const boardRing = (bandIndex + 1) as 1 | 2 | 3 | 4;
        for (let boardIndex = 0; boardIndex < 8; boardIndex += 1) {
          const cell = getSolarWheelCellAtBoard(
            setupConfig.wheels,
            wheel,
            bandIndex,
            boardIndex,
            discAngles,
          );
          const label = getTextModeCellLabel(cell.cell);
          if (!label) {
            continue;
          }

          const labelPosition = textModeCellPosition(boardRing, boardIndex);
          items.push({
            key: `${wheel}:${bandIndex}:${boardIndex}`,
            label,
            wheel,
            boardRing,
            boardIndex,
            ...labelPosition,
          });
        }
      }
    }

    return items;
  }, [textMode, setupConfig.wheels, discAngleByRing]);

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

  const reachable = useMemo(
    () => new Set(reachablePathBySpaceId.keys()),
    [reachablePathBySpaceId],
  );

  function handleSpaceClick(spaceId: string): void {
    const hasMyProbe = (probeView.bySpacePlayers[spaceId] ?? []).includes(
      myPlayerId,
    );
    const hasAnyProbe = (probeView.bySpacePlayers[spaceId] ?? []).length > 0;
    if (hasMyProbe || (allowMoveAnyProbe && hasAnyProbe)) {
      setSelectedSpaceId((prev) => (prev === spaceId ? null : spaceId));
      return;
    }

    if (selectedSpaceId) {
      const path = reachablePathBySpaceId.get(spaceId);
      if (!path) {
        return;
      }
      onMoveProbe(path);
      setSelectedSpaceId(spaceId);
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
            const layerStyle = TEXT_MODE_SPACE_STYLE_BY_RING[item.wheel];
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
                  zIndex: TEXT_MODE_LABEL_Z_INDEX_BY_WHEEL[item.wheel],
                }}
              >
                <span
                  className={cn(
                    'inline-flex h-[18px] w-[58px] items-center justify-center overflow-hidden rounded-sm border font-mono text-[8px] uppercase leading-none shadow-[0_1px_2px_rgba(0,0,0,0.65)]',
                    item.label.kind === 'empty'
                      ? 'bg-transparent text-transparent'
                      : isPlanetLabel
                        ? 'bg-white'
                        : 'border-surface-500 bg-surface-900 text-text-100',
                  )}
                  style={{
                    transform: `rotate(${item.rotationDeg}deg)`,
                    transformOrigin: 'center',
                    borderColor: isPlanetLabel
                      ? '#ffffff'
                      : layerStyle.borderColor,
                    color: isPlanetLabel ? '#020617' : layerStyle.textColor,
                  }}
                >
                  {item.label.label}
                </span>
              </span>
            );
          })}

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
