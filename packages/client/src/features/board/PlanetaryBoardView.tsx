import {
  type IPlanetMissionConfig,
  PLANET_MISSION_CONFIG,
  PLANETARY_BOARD_DIMENSIONS,
  PLANETARY_PLANETS,
} from '@seti/common/constant/boardLayout';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import type {
  IPlayerInputModel,
  IPublicPlanetaryBoard,
  IPublicPlanetState,
} from '@/types/re-exports';
import { EPlanet, EPlayerInputType } from '@/types/re-exports';
import {
  formatFirstLandData,
  formatFirstOrbitRewardList,
  formatPlanetRewardList,
  PlanetCard,
} from './PlanetCard';

function createEmptyPlanetState(
  config: IPlanetMissionConfig,
): IPublicPlanetState {
  return {
    orbitSlots: [],
    landingSlots: [],
    firstOrbitClaimed: false,
    firstLandDataBonusTaken: Array.from(
      { length: config.land.firstData.length },
      () => false,
    ),
    moonOccupant: null,
  };
}

function getPlanetConfig(
  planetaryBoard: IPublicPlanetaryBoard,
  planet: (typeof PLANETARY_PLANETS)[number],
): IPlanetMissionConfig {
  return planetaryBoard.configs?.[planet] ?? PLANET_MISSION_CONFIG[planet];
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
  const textMode = useTextMode();
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
            data-testid={textMode ? 'planetary-board-text-mode' : undefined}
            className={cn(
              'relative w-full',
              textMode ? 'bg-surface-950/70' : 'bg-cover bg-center',
            )}
            style={{
              aspectRatio: `${PLANETARY_BOARD_DIMENSIONS.width} / ${PLANETARY_BOARD_DIMENSIONS.height}`,
              ...(textMode
                ? {
                    backgroundImage:
                      'linear-gradient(rgba(38,48,80,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(38,48,80,0.35) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                  }
                : {
                    backgroundImage:
                      'linear-gradient(rgba(8, 13, 25, 0.2), rgba(8, 13, 25, 0.35)), url(/assets/seti/boards/planetBoard.jpg)',
                    backgroundSize: '100% 100%',
                  }),
            }}
          >
            {PLANETARY_PLANETS.map((planet) => {
              const marker = getPlanetConfig(planetaryBoard, planet);
              const planetState =
                planetaryBoard.planets[planet] ??
                createEmptyPlanetState(marker);
              const orbitSummary = [
                formatPlanetRewardList(marker.orbit.rewards),
                formatFirstOrbitRewardList(marker.orbit.firstRewards),
              ]
                .filter(Boolean)
                .join(' + ');
              const landSummary = [
                formatPlanetRewardList(marker.land.rewards),
                marker.land.firstData.length > 0
                  ? `first data ${formatFirstLandData(marker.land.firstData)}`
                  : '',
              ]
                .filter(Boolean)
                .join(' + ');

              const moonSlotIndexes = marker.landingSlotKinds
                .map((kind, index) => ({ kind, index }))
                .filter((slot) => slot.kind === 'moon')
                .map((slot) => slot.index);
              const firstMoonSlotIndex = moonSlotIndexes[0];
              return (
                <div key={`planet-overlay-${planet}`}>
                  <span
                    className={cn(
                      'absolute -translate-x-1/2 -translate-y-1/2 border border-surface-200/60 bg-surface-900/75 font-bold uppercase text-text-100 shadow-[0_0_8px_rgba(0,0,0,0.4)]',
                      textMode
                        ? 'inline-flex w-[150px] flex-col items-start justify-center gap-0.5 rounded-sm px-2 py-1 text-left font-mono text-[8px] leading-tight'
                        : 'inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] tracking-wide',
                      selectablePlanets.has(planet) &&
                        'border-accent-500 text-accent-300 ring-1 ring-accent-500/80',
                    )}
                    style={{
                      left: `${marker.anchor.x}%`,
                      top: `${marker.anchor.y}%`,
                    }}
                    title={`${marker.label} | moons: ${marker.moonNames.join(', ') || 'none'}`}
                  >
                    {textMode ? (
                      <>
                        <span className='text-[10px] text-text-100'>
                          {marker.label.toLowerCase()}
                        </span>
                        <span className='font-normal normal-case text-text-300'>
                          O: {orbitSummary}
                        </span>
                        <span className='font-normal normal-case text-text-300'>
                          L: {landSummary}
                        </span>
                      </>
                    ) : (
                      marker.label.slice(0, 2)
                    )}
                  </span>

                  {marker.orbitSlots.map((slot, index) => {
                    const occupied = planetState.orbitSlots[index];
                    if (!occupied) {
                      return (
                        <span
                          key={`${planet}-orbit-slot-${index}`}
                          className={cn(
                            'absolute -translate-x-1/2 -translate-y-1/2 border border-cyan-300/70 bg-surface-950/60',
                            textMode
                              ? 'inline-flex h-4 min-w-6 items-center justify-center rounded-sm px-1 font-mono text-[8px] text-cyan-200'
                              : 'h-3.5 w-3.5 rounded-full',
                          )}
                          style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                          title={`${marker.label} orbit slot ${index + 1}`}
                        >
                          {textMode ? `O${index + 1}` : null}
                        </span>
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
                          'absolute -translate-x-1/2 -translate-y-1/2 border bg-surface-950/60',
                          textMode
                            ? 'inline-flex h-4 min-w-6 items-center justify-center rounded-sm px-1 font-mono text-[8px]'
                            : 'h-3.5 w-3.5 rounded-full',
                          slotKind === 'moon'
                            ? 'border-surface-500/70 text-text-300'
                            : 'border-amber-300/70 text-amber-200',
                        )}
                        style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                        title={`${marker.label} ${slotKind} slot ${index + 1}`}
                      >
                        {textMode
                          ? `${slotKind === 'moon' ? 'M' : 'L'}${index + 1}`
                          : null}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-3'>
          {PLANETARY_PLANETS.map((planet) => {
            const config = getPlanetConfig(planetaryBoard, planet);
            return (
              <PlanetCard
                key={planet}
                planet={planet}
                config={config}
                state={
                  planetaryBoard.planets[planet] ??
                  createEmptyPlanetState(config)
                }
                playerColors={playerColors}
                isSelectable={selectablePlanets.has(planet)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
