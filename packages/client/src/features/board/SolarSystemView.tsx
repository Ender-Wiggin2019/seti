import type { ISolarSystemSetupConfig } from '@seti/common/constant/sectorSetup';
import { useMemo, useState } from 'react';
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
    1: 50,
    2: 50,
    3: 50,
    4: 50,
  };
const PROBE_TRANSITION_MS = 900;

export type TProbeInsetPxByRing = Readonly<Record<1 | 2 | 3 | 4, number>>;

interface ISolarSystemViewProps {
  solarSystem: IPublicSolarSystem;
  sectors: IPublicSector[];
  setupConfig: ISolarSystemSetupConfig;
  pendingInput: IPlayerInputModel | null;
  playerColors: Record<string, string>;
  myPlayerId: string;
  onMoveProbe: (fromSpaceId: string, toSpaceId: string) => void;
  onRespondInput: (response: IInputResponse) => void;
  showSpaceConfigDebug?: boolean;
  probeInsetPxByRing?: TProbeInsetPxByRing;
}

interface ISpacePoint {
  spaceId: string;
  ringIndex: 1 | 2 | 3 | 4;
  indexInRing: number;
  xPercent: number;
  yPercent: number;
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
): { xPercent: number; yPercent: number } {
  const direction = ((indexInRing % 8) + 8) % 8;
  const radius = spaceRadiiPercent[ringIndex - 1] ?? spaceRadiiPercent[0] ?? 0;
  const angle = (Math.PI / 4) * (0.5 + direction);
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

export function SolarSystemView({
  solarSystem,
  sectors,
  setupConfig,
  pendingInput,
  playerColors,
  myPlayerId,
  onMoveProbe,
  onRespondInput,
  showSpaceConfigDebug = false,
  probeInsetPxByRing,
}: ISolarSystemViewProps): React.JSX.Element {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

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

  const spacePoints = useMemo<ISpacePoint[]>(() => {
    const states = solarSystem.spaceStates;
    const usesZeroBasedRingIndex = Boolean(
      states && Object.values(states).some((state) => state.ringIndex === 0),
    );

    return solarSystem.spaces.map((spaceId, idx) => {
      const state = states?.[spaceId];
      const fallbackRing = (Math.floor(idx / 8) + 1) as 1 | 2 | 3 | 4;
      const fallbackIndexInRing = idx % 8;

      let ringIndex = fallbackRing;
      let indexInRing = fallbackIndexInRing;

      if (state) {
        const rawRingIndex = usesZeroBasedRingIndex
          ? state.ringIndex + 1
          : state.ringIndex;
        const normalizedRingIndex = normalizeRingIndex(rawRingIndex);
        if (normalizedRingIndex) {
          ringIndex = normalizedRingIndex;
          indexInRing = ((state.indexInRing % 8) + 8) % 8;
        }
      }

      const pos = spacePosition(ringIndex, indexInRing, spaceRadiiPercent);
      return { spaceId, ringIndex, indexInRing, ...pos };
    });
  }, [solarSystem.spaces, solarSystem.spaceStates, spaceRadiiPercent]);

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

  const probesBySpace = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const probe of solarSystem.probes) {
      if (!map[probe.spaceId]) map[probe.spaceId] = [];
      map[probe.spaceId].push(probe.playerId);
    }
    return map;
  }, [solarSystem.probes]);

  const reachable = useMemo(() => {
    if (!selectedSpaceId) return new Set<string>();
    return new Set(solarSystem.adjacency[selectedSpaceId] ?? []);
  }, [selectedSpaceId, solarSystem.adjacency]);

  function handleSpaceClick(spaceId: string): void {
    const hasMyProbe = (probesBySpace[spaceId] ?? []).includes(myPlayerId);
    if (hasMyProbe) {
      setSelectedSpaceId((prev) => (prev === spaceId ? null : spaceId));
      return;
    }

    if (selectedSpaceId && reachable.has(spaceId)) {
      onMoveProbe(selectedSpaceId, spaceId);
      setSelectedSpaceId(spaceId);
    }
  }

  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/30 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          Solar System
        </h2>
      </header>

      <div
        className='relative mx-auto aspect-square w-full max-w-[760px] overflow-hidden rounded-md'
        style={{
          backgroundImage: 'url(/assets/seti/boards/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <WheelLayer ring={4} angle={0} className='z-5' />
        <WheelLayer
          ring={3}
          angle={getDiscAngle(solarSystem, 3)}
          className='z-6'
        />
        <WheelLayer
          ring={2}
          angle={getDiscAngle(solarSystem, 2)}
          className='z-7'
        />
        <WheelLayer
          ring={1}
          angle={getDiscAngle(solarSystem, 1)}
          className='z-8'
        />

        <img
          src='/assets/seti/sun.png'
          alt=''
          aria-hidden
          className='pointer-events-none absolute left-1/2 top-1/2 z-200 w-[10%] -translate-x-1/2 -translate-y-1/2 select-none'
          style={{ animation: 'spin 1800s linear infinite' }}
          draggable={false}
        />

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
        />

        {spacePoints.map((space) => {
          const probeCount = probesBySpace[space.spaceId]?.length ?? 0;
          const hasMyProbe = (probesBySpace[space.spaceId] ?? []).includes(
            myPlayerId,
          );
          const isSelected = selectedSpaceId === space.spaceId;
          const isReachable = reachable.has(space.spaceId);

          return (
            <button
              key={space.spaceId}
              type='button'
              data-testid={`solar-space-${space.spaceId}`}
              className='absolute z-300 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-transparent bg-transparent transition-all hover:border-accent-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/60'
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

        {spacePoints.map((space) => {
          const players = probesBySpace[space.spaceId] ?? [];
          if (players.length === 0) {
            return null;
          }

          return (
            <div
              key={`probe-stack-${space.spaceId}`}
              className='pointer-events-none absolute z-350 flex min-h-6 min-w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full'
              style={{
                left: `${space.xPercent}%`,
                top: `${space.yPercent}%`,
                transition: `left ${PROBE_TRANSITION_MS}ms ease-out, top ${PROBE_TRANSITION_MS}ms ease-out`,
              }}
            >
              <div className='flex max-w-10 flex-wrap items-center justify-center gap-0.5'>
                {players.map((playerId, tokenIndex) => (
                  <ProbeToken
                    key={`${space.spaceId}-${playerId}-${tokenIndex}`}
                    playerColor={playerColors[playerId] ?? 'white'}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {showSpaceConfigDebug && (
          <div
            className='pointer-events-none absolute inset-0'
            style={{ zIndex: 450 }}
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
