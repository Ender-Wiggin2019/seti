import { useMemo, useState } from 'react';
import type {
  IInputResponse,
  IMovementFreeActionRequest,
  IPlayerInputModel,
  IPublicSector,
  IPublicSolarSystem,
} from '@/types/re-exports';
import { EFreeAction, EPlayerInputType } from '@/types/re-exports';
import { ProbeToken } from './ProbeToken';
import { SectorGrid } from './SectorGrid';
import { WheelLayer } from './WheelLayer';

const SPACE_RADII_PERCENT = [13, 22.8, 32.6, 42.4] as const;
const SOLAR_DISC_SCALE_PERCENT = 85;

interface ISolarSystemViewProps {
  solarSystem: IPublicSolarSystem;
  sectors: IPublicSector[];
  pendingInput: IPlayerInputModel | null;
  playerColors: Record<string, string>;
  myPlayerId: string;
  onMoveProbe: (fromSpaceId: string, toSpaceId: string) => void;
  onRespondInput: (response: IInputResponse) => void;
}

interface ISpacePoint {
  spaceId: string;
  xPercent: number;
  yPercent: number;
}

function extractSpaceIndex(spaceId: string): number | null {
  const m = spaceId.match(/(\d+)$/);
  if (!m) return null;
  return Number.parseInt(m[1], 10);
}

function spacePosition(index: number): { xPercent: number; yPercent: number } {
  const distance = Math.floor(index / 8) + 1;
  const direction = index % 8;
  const radius = SPACE_RADII_PERCENT[distance - 1] ?? SPACE_RADII_PERCENT[0];
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
  pendingInput,
  playerColors,
  myPlayerId,
  onMoveProbe,
  onRespondInput,
}: ISolarSystemViewProps): React.JSX.Element {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  const spacePoints = useMemo<ISpacePoint[]>(() => {
    return solarSystem.spaces.map((spaceId, idx) => {
      const parsed = extractSpaceIndex(spaceId);
      const index = parsed ?? idx;
      const pos = spacePosition(index);
      return { spaceId, ...pos };
    });
  }, [solarSystem.spaces]);

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

      <div className='relative mx-auto aspect-square w-full max-w-[760px] overflow-visible rounded-md'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(36,54,89,0.35),rgba(8,13,25,0.2)_45%,rgba(8,13,25,0.7)_100%)]' />

        <div
          className='absolute left-1/2 top-1/2 z-10 aspect-square -translate-x-1/2 -translate-y-1/2'
          style={{ width: `${SOLAR_DISC_SCALE_PERCENT}%` }}
        >
          <WheelLayer ring={4} angle={0} className='z-0' />
          <WheelLayer
            ring={3}
            angle={getDiscAngle(solarSystem, 3)}
            className='z-10'
          />
          <WheelLayer
            ring={2}
            angle={getDiscAngle(solarSystem, 2)}
            className='z-20'
          />
          <WheelLayer
            ring={1}
            angle={getDiscAngle(solarSystem, 1)}
            className='z-30'
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
                className='absolute z-30 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-transparent bg-transparent transition-all hover:border-accent-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/60'
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
            return players.map((playerId, tokenIndex) => (
              <ProbeToken
                key={`${space.spaceId}-${playerId}-${tokenIndex}`}
                playerColor={playerColors[playerId] ?? 'white'}
                xPercent={space.xPercent}
                yPercent={space.yPercent}
                offsetIndex={tokenIndex}
                offsetCount={players.length}
              />
            ));
          })}
        </div>

        <SectorGrid
          sectors={sectors}
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
      </div>
    </section>
  );
}

export function buildMoveAction(
  fromSpaceId: string,
  toSpaceId: string,
): IMovementFreeActionRequest {
  return {
    type: EFreeAction.MOVEMENT,
    fromSpaceId,
    toSpaceId,
  };
}
