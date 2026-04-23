import {
  PLANET_MISSION_CONFIG,
  PLANETARY_BOARD_DIMENSIONS,
  PLANETARY_PLANETS,
} from '@seti/common/constant/boardLayout';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type {
  IPlayerInputModel,
  IPublicPlanetaryBoard,
  IPublicPlanetState,
} from '@/types/re-exports';
import { EPlanet, EPlayerInputType } from '@/types/re-exports';
import { PlanetCard } from './PlanetCard';

function createEmptyPlanetState(
  planet: keyof typeof PLANET_MISSION_CONFIG,
): IPublicPlanetState {
  const config = PLANET_MISSION_CONFIG[planet];
  return {
    orbitSlots: [],
    landingSlots: [],
    firstOrbitClaimed: false,
    firstLandDataBonusTaken: Array.from(
      { length: config.firstLandDataBonusSlots },
      () => false,
    ),
    moonOccupant: null,
  };
}

interface IPlanetaryBoardViewProps {
  planetaryBoard: IPublicPlanetaryBoard;
  pendingInput: IPlayerInputModel | null;
  playerColors: Record<string, string>;
}

function TokenAtPoint({
  x,
  y,
  playerId,
  playerColors,
  title,
}: {
  x: number;
  y: number;
  playerId: string;
  playerColors: Record<string, string>;
  title: string;
}): React.JSX.Element {
  return (
    <span
      className='absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface-200/80 shadow-[0_0_8px_rgba(0,0,0,0.45)]'
      style={{
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: playerColors[playerId] ?? '#cbd5e1',
      }}
      title={title}
    />
  );
}

export function PlanetaryBoardView({
  planetaryBoard,
  pendingInput,
  playerColors,
}: IPlanetaryBoardViewProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const selectablePlanets =
    pendingInput?.type === EPlayerInputType.PLANET
      ? new Set(pendingInput.options)
      : new Set<EPlanet>();

  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          {t('client.board.planetary_board')}
        </h2>
      </header>

      <div className='rounded-md border border-surface-700/50 bg-surface-950/40 p-3'>
        <div className='relative mx-auto mb-3 w-full max-w-[760px] overflow-hidden rounded-md border border-surface-700/50'>
          <div
            className='relative w-full bg-cover bg-center'
            style={{
              aspectRatio: `${PLANETARY_BOARD_DIMENSIONS.width} / ${PLANETARY_BOARD_DIMENSIONS.height}`,
              backgroundImage:
                'linear-gradient(rgba(8, 13, 25, 0.2), rgba(8, 13, 25, 0.35)), url(/assets/seti/boards/planetBoard.jpg)',
              backgroundSize: '100% 100%',
            }}
          >
            {PLANETARY_PLANETS.map((planet) => {
              const marker = PLANET_MISSION_CONFIG[planet];
              const planetState =
                planetaryBoard.planets[planet] ??
                createEmptyPlanetState(planet);

              const moonSlotIndexes = marker.landingSlotKinds
                .map((kind, index) => ({ kind, index }))
                .filter((slot) => slot.kind === 'moon')
                .map((slot) => slot.index);
              const firstMoonSlotIndex = moonSlotIndexes[0];
              return (
                <div key={`planet-overlay-${planet}`}>
                  <span
                    className={cn(
                      'absolute inline-flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-surface-200/60 bg-surface-900/75 text-[10px] font-bold uppercase tracking-wide text-text-100 shadow-[0_0_8px_rgba(0,0,0,0.4)]',
                      selectablePlanets.has(planet) &&
                        'border-accent-500 text-accent-300 ring-1 ring-accent-500/80',
                    )}
                    style={{
                      left: `${marker.anchor.x}%`,
                      top: `${marker.anchor.y}%`,
                    }}
                    title={`${marker.label} | moons: ${marker.moonNames.join(', ') || 'none'}`}
                  >
                    {marker.label.slice(0, 2)}
                  </span>

                  {marker.orbitSlots.map((slot, index) => {
                    const occupied = planetState.orbitSlots[index];
                    if (!occupied) {
                      return (
                        <span
                          key={`${planet}-orbit-slot-${index}`}
                          className='absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/70 bg-surface-950/60'
                          style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                          title={`${marker.label} orbit slot ${index + 1}`}
                        />
                      );
                    }
                    return (
                      <TokenAtPoint
                        key={`${planet}-orbit-token-${index}`}
                        x={slot.x}
                        y={slot.y}
                        playerId={occupied.playerId}
                        playerColors={playerColors}
                        title={`${marker.label} orbit (${occupied.playerId})`}
                      />
                    );
                  })}

                  {marker.landingSlots.map((slot, index) => {
                    const slotKind = marker.landingSlotKinds[index] ?? 'planet';
                    const planetSlotOrdinal =
                      marker.landingSlotKinds
                        .slice(0, index + 1)
                        .filter((kind) => kind === 'planet').length - 1;
                    const planetLandingToken =
                      slotKind === 'planet'
                        ? planetState.landingSlots[planetSlotOrdinal]
                        : null;
                    const moonToken =
                      slotKind === 'moon' && firstMoonSlotIndex === index
                        ? planetState.moonOccupant
                        : null;
                    const tokenPlayerId =
                      planetLandingToken?.playerId ??
                      moonToken?.playerId ??
                      null;

                    if (tokenPlayerId) {
                      return (
                        <TokenAtPoint
                          key={`${planet}-landing-token-${index}`}
                          x={slot.x}
                          y={slot.y}
                          playerId={tokenPlayerId}
                          playerColors={playerColors}
                          title={`${marker.label} ${slotKind} (${tokenPlayerId})`}
                        />
                      );
                    }

                    return (
                      <span
                        key={`${planet}-landing-slot-${index}`}
                        className={cn(
                          'absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-surface-950/60',
                          slotKind === 'moon'
                            ? 'border-surface-500/70'
                            : 'border-amber-300/70',
                        )}
                        style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                        title={`${marker.label} ${slotKind} slot ${index + 1}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-3'>
          {PLANETARY_PLANETS.map((planet) => (
            <PlanetCard
              key={planet}
              planet={planet}
              state={
                planetaryBoard.planets[planet] ?? createEmptyPlanetState(planet)
              }
              playerColors={playerColors}
              isSelectable={selectablePlanets.has(planet)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
