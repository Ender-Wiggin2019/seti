import { cn } from '@/lib/cn';
import type { IPublicPlanetState } from '@/types/re-exports';
import { EPlanet } from '@/types/re-exports';

const PLANET_LABEL: Record<EPlanet, string> = {
  [EPlanet.EARTH]: 'Earth',
  [EPlanet.MARS]: 'Mars',
  [EPlanet.JUPITER]: 'Jupiter',
  [EPlanet.SATURN]: 'Saturn',
  [EPlanet.MERCURY]: 'Mercury',
  [EPlanet.VENUS]: 'Venus',
  [EPlanet.URANUS]: 'Uranus',
  [EPlanet.NEPTUNE]: 'Neptune',
};

interface IPlanetCardProps {
  planet: EPlanet;
  state: IPublicPlanetState;
  playerColors: Record<string, string>;
  isSelectable: boolean;
}

function TokenDot({
  playerId,
  playerColors,
}: {
  playerId: string;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <span
      className='inline-flex h-3.5 w-3.5 rounded-full border border-surface-200/30'
      style={{ backgroundColor: playerColors[playerId] ?? '#cbd5e1' }}
      title={playerId}
      aria-label={`token-${playerId}`}
    />
  );
}

export function PlanetCard({
  planet,
  state,
  playerColors,
  isSelectable,
}: IPlanetCardProps): React.JSX.Element {
  return (
    <article
      data-testid={`planet-card-${planet}`}
      className={cn(
        'rounded-md border border-surface-700/50 bg-surface-900/60 p-3 transition-colors',
        isSelectable && 'border-accent-500 ring-1 ring-accent-500/70',
      )}
    >
      <header className='mb-2 flex items-center justify-between'>
        <h3 className='font-display text-sm font-semibold uppercase tracking-wide text-text-100'>
          {PLANET_LABEL[planet]}
        </h3>
        <div className='flex items-center gap-1'>
          <span
            className={cn(
              'rounded border px-1.5 py-0.5 font-mono text-[10px]',
              state.firstOrbitClaimed
                ? 'border-surface-600 text-text-500'
                : 'border-accent-500/70 text-accent-300',
            )}
          >
            Orbit +3VP
          </span>
        </div>
      </header>

      <div className='grid grid-cols-2 gap-2'>
        <section className='rounded border border-surface-700/50 bg-surface-800/40 p-2'>
          <p className='mb-1 font-mono text-[10px] uppercase tracking-wider text-text-500'>
            Orbit
          </p>
          <div className='flex min-h-5 flex-wrap gap-1'>
            {state.orbitSlots.length === 0 ? (
              <span className='text-[11px] text-text-500'>Empty</span>
            ) : (
              state.orbitSlots.map((slot, index) => (
                <TokenDot
                  key={`${slot.playerId}-orbit-${index}`}
                  playerId={slot.playerId}
                  playerColors={playerColors}
                />
              ))
            )}
          </div>
        </section>

        <section className='rounded border border-surface-700/50 bg-surface-800/40 p-2'>
          <p className='mb-1 font-mono text-[10px] uppercase tracking-wider text-text-500'>
            Landing
          </p>
          <div className='flex min-h-5 flex-wrap gap-1'>
            {state.landingSlots.length === 0 ? (
              <span className='text-[11px] text-text-500'>Empty</span>
            ) : (
              state.landingSlots.map((slot, index) => (
                <TokenDot
                  key={`${slot.playerId}-landing-${index}`}
                  playerId={slot.playerId}
                  playerColors={playerColors}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <div className='mt-2 flex items-center justify-between gap-2'>
        <div className='flex flex-wrap gap-1'>
          {state.firstLandDataBonusTaken.map((taken, index) => (
            <span
              key={`${planet}-bonus-${index}`}
              className={cn(
                'rounded border px-1.5 py-0.5 font-mono text-[10px]',
                taken
                  ? 'border-surface-600 text-text-500'
                  : 'border-accent-500/70 text-accent-300',
              )}
            >
              Data {index + 1}
            </span>
          ))}
        </div>
        <span
          className={cn(
            'rounded border px-1.5 py-0.5 font-mono text-[10px]',
            state.moonUnlocked
              ? 'border-info-500/70 text-info-300'
              : 'border-surface-600 text-text-500',
          )}
        >
          Moon:{' '}
          {state.moonOccupant
            ? `occupied (${state.moonOccupant.playerId})`
            : state.moonUnlocked
              ? 'open'
              : 'locked'}
        </span>
      </div>
    </article>
  );
}
