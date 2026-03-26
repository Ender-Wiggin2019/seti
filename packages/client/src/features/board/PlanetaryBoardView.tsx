import type {
  IPlayerInputModel,
  IPublicPlanetaryBoard,
  IPublicPlanetState,
} from '@/types/re-exports';
import { EPlanet, EPlayerInputType } from '@/types/re-exports';
import { PlanetCard } from './PlanetCard';

const ALL_PLANETS: EPlanet[] = [
  EPlanet.EARTH,
  EPlanet.MERCURY,
  EPlanet.VENUS,
  EPlanet.MARS,
  EPlanet.JUPITER,
  EPlanet.SATURN,
  EPlanet.URANUS,
  EPlanet.NEPTUNE,
];

function createEmptyPlanetState(): IPublicPlanetState {
  return {
    orbitSlots: [],
    landingSlots: [],
    firstOrbitClaimed: false,
    firstLandDataBonusTaken: [false],
    moonOccupant: null,
    moonUnlocked: false,
  };
}

interface IPlanetaryBoardViewProps {
  planetaryBoard: IPublicPlanetaryBoard;
  pendingInput: IPlayerInputModel | null;
  playerColors: Record<string, string>;
}

export function PlanetaryBoardView({
  planetaryBoard,
  pendingInput,
  playerColors,
}: IPlanetaryBoardViewProps): React.JSX.Element {
  const selectablePlanets =
    pendingInput?.type === EPlayerInputType.PLANET
      ? new Set(pendingInput.options)
      : new Set<EPlanet>();

  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          Planetary Board
        </h2>
      </header>

      <div
        className='rounded-md border border-surface-700/50 bg-surface-950/40 p-3'
        style={{
          backgroundImage:
            'linear-gradient(rgba(8, 13, 25, 0.65), rgba(8, 13, 25, 0.8)), url(/assets/seti/boards/planetBoard.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>
          {ALL_PLANETS.map((planet) => (
            <PlanetCard
              key={planet}
              planet={planet}
              state={planetaryBoard.planets[planet] ?? createEmptyPlanetState()}
              playerColors={playerColors}
              isSelectable={selectablePlanets.has(planet)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
