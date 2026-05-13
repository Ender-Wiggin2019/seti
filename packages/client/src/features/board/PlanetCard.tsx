import { DescRender } from '@seti/cards';
import type {
  IPlanetaryBoardConfig,
  TPlanetReward,
} from '@seti/common/constant/boardLayout';
import { EResource, ESector, ETrace } from '@seti/common/types/element';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type {
  IPublicMoonOccupantState,
  IPublicPlanetState,
} from '@/types/re-exports';

interface IPlanetCardProps {
  planet: string;
  config: IPlanetaryBoardConfig;
  state: IPublicPlanetState;
  playerColors: Record<string, string>;
  isSelectable: boolean;
  onSelect?: () => void;
  selectableMoonIds?: ReadonlySet<string>;
  onSelectMoon?: (moonId: string) => void;
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

function traceLabel(trace: ETrace): string {
  switch (trace) {
    case ETrace.RED:
      return 'red';
    case ETrace.YELLOW:
      return 'yellow';
    case ETrace.BLUE:
      return 'blue';
    case ETrace.ANY:
      return 'any';
    default:
      return String(trace);
  }
}

function signalLabel(sector: ESector): string {
  switch (sector) {
    case ESector.RED:
      return 'red';
    case ESector.YELLOW:
      return 'yellow';
    case ESector.BLUE:
      return 'blue';
    case ESector.BLACK:
      return 'black';
    default:
      return String(sector);
  }
}

function getMoonOccupants(
  state: IPublicPlanetState,
): IPublicMoonOccupantState[] {
  return state.moonOccupants;
}

export function formatPlanetReward(reward: TPlanetReward): string {
  switch (reward.type) {
    case 'resource':
      if (reward.resource === EResource.SCORE) {
        return `${reward.amount} VP`;
      }
      if (reward.resource === EResource.DATA) {
        return `${reward.amount} data`;
      }
      return `${reward.amount} ${reward.resource}`;
    case 'trace':
      return `${reward.amount} ${traceLabel(reward.trace)} trace`;
    case 'signal':
      if ('sector' in reward) {
        return `${reward.amount} ${signalLabel(reward.sector)} signal`;
      }
      return `${reward.amount} signal @ planet sector`;
    case 'card':
      return `${reward.amount} ${reward.source} card`;
    case 'alien-card':
      return `${reward.amount} alien card`;
    case 'exofossil':
      return `${reward.amount} exofossil`;
    case 'tuck':
      return `${reward.amount} tuck`;
    default: {
      const exhaustive: never = reward;
      return exhaustive;
    }
  }
}

export function formatPlanetRewardList(
  rewards: readonly TPlanetReward[],
): string {
  return rewards.map(formatPlanetReward).join(' + ');
}

export function planetRewardToDesc(reward: TPlanetReward): string {
  switch (reward.type) {
    case 'resource':
      return `{${reward.resource}-${reward.amount}}`;
    case 'trace':
      return `{${reward.trace}-${reward.amount}}`;
    case 'signal':
      if ('sector' in reward) {
        return `{${reward.sector}-${reward.amount}}`;
      }
      return `{any-signal-${reward.amount}} @ planet`;
    case 'card':
      return reward.source === 'any'
        ? `{any-card-${reward.amount}}`
        : `{draw-card-${reward.amount}}`;
    case 'alien-card':
      return `{draw-alien-card-${reward.amount}}`;
    case 'exofossil':
      return `{exofossil-${reward.amount}}`;
    case 'tuck':
      return `{income-${reward.amount}}`;
    default: {
      const exhaustive: never = reward;
      return exhaustive;
    }
  }
}

export function planetRewardListToDesc(
  rewards: readonly TPlanetReward[],
): string {
  return rewards.map(planetRewardToDesc).join(' + ');
}

export function formatFirstOrbitRewardList(
  rewards: readonly TPlanetReward[],
): string {
  return rewards
    .map((reward) => `first ${formatPlanetReward(reward)}`)
    .join(' + ');
}

export function formatFirstLandData(firstData: readonly number[]): string {
  return firstData.join(' / ');
}

function RewardIcons({
  rewards,
  testId,
}: {
  rewards: readonly TPlanetReward[];
  testId: string;
}): React.JSX.Element {
  return (
    <div
      data-testid={testId}
      aria-label={formatPlanetRewardList(rewards)}
      className='flex min-h-8 items-center justify-center'
    >
      <DescRender
        desc={planetRewardListToDesc(rewards)}
        size='desc-mini'
        smartSize
      />
    </div>
  );
}

function FirstDataIcons({
  firstData,
  testId,
}: {
  firstData: readonly number[];
  testId: string;
}): React.JSX.Element {
  const desc = firstData
    .map((amount) => `{${EResource.DATA}-${amount}}`)
    .join(' / ');
  return (
    <div
      data-testid={testId}
      aria-label={formatFirstLandData(firstData)}
      className='flex min-h-8 items-center justify-center'
    >
      <DescRender desc={desc} size='desc-mini' smartSize />
    </div>
  );
}

export function PlanetCard({
  planet,
  config,
  state,
  playerColors,
  isSelectable,
  onSelect,
  selectableMoonIds = new Set<string>(),
  onSelectMoon,
}: IPlanetCardProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const planetConfig = config;
  const firstLandData = formatFirstLandData(planetConfig.land.firstData);
  const moonOccupants = getMoonOccupants(state);
  const primaryMoonOccupant = moonOccupants[0] ?? null;

  const interactive = isSelectable && onSelect !== undefined;

  return (
    <article
      data-testid={`planet-card-${planet}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onSelect : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      className={cn(
        'rounded-md border border-surface-700/50 bg-surface-900/60 p-3 transition-colors',
        isSelectable && 'border-accent-500 ring-1 ring-accent-500/70',
        interactive &&
          'cursor-pointer hover:bg-surface-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
      )}
    >
      <header className='mb-2 flex items-center justify-between'>
        <h3 className='font-display text-sm font-semibold uppercase tracking-wide text-text-100'>
          {planetConfig.label}
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
            {t('client.planet_card.orbit_bonus')}
          </span>
        </div>
      </header>

      <div className='mb-2 grid gap-2 rounded border border-surface-700/50 bg-surface-950/40 p-2 font-mono text-[10px] leading-snug text-text-300'>
        <section>
          <p className='mb-1 uppercase tracking-[0.12em] text-text-500'>
            {t('client.planet_card.orbit_reward')}
          </p>
          <RewardIcons
            rewards={planetConfig.orbit.rewards}
            testId={`planet-reward-icons-${planet}-orbit`}
          />
        </section>
        <section>
          <p className='mb-1 uppercase tracking-[0.12em] text-text-500'>
            {t('client.planet_card.first_orbit')}
          </p>
          <RewardIcons
            rewards={planetConfig.orbit.firstRewards}
            testId={`planet-reward-icons-${planet}-first-orbit`}
          />
        </section>
        <section>
          <p className='mb-1 uppercase tracking-[0.12em] text-text-500'>
            {t('client.planet_card.land_reward')}
          </p>
          <RewardIcons
            rewards={planetConfig.land.rewards}
            testId={`planet-reward-icons-${planet}-land`}
          />
        </section>
        {firstLandData.length > 0 && (
          <section>
            <p className='mb-1 uppercase tracking-[0.12em] text-text-500'>
              {t('client.planet_card.first_land_data')}
            </p>
            <FirstDataIcons
              firstData={planetConfig.land.firstData}
              testId={`planet-reward-icons-${planet}-first-land-data`}
            />
          </section>
        )}
        {planetConfig.land.moonRewards.length > 0 && (
          <div
            data-testid={`moon-rewards-${planet}`}
            className='mt-1 grid gap-1.5'
          >
            {planetConfig.land.moonRewards.map((rewards, index) => {
              const moonId = planetConfig.moonIds[index] ?? `moon-${index}`;
              const moonName =
                planetConfig.moonNames[index] ?? `Moon ${index + 1}`;
              const occupant = moonOccupants.find(
                (candidate) => candidate.moonId === moonId,
              );
              const blockClassName = cn(
                'relative rounded border border-surface-700/60 bg-surface-800/45 px-2 pb-1.5 pt-2 text-center',
                selectableMoonIds.has(moonId) &&
                  'border-accent-500/80 bg-accent-500/10 ring-1 ring-accent-500/60',
              );
              const content = (
                <>
                  {occupant && (
                    <span className='absolute right-1.5 top-1.5'>
                      <TokenDot
                        playerId={occupant.playerId}
                        playerColors={playerColors}
                      />
                    </span>
                  )}
                  <RewardIcons
                    rewards={rewards}
                    testId={`moon-reward-icons-${planet}-${moonId}`}
                  />
                  <p className='mt-1 text-[10px] uppercase tracking-[0.08em] text-text-500'>
                    {moonName}
                  </p>
                </>
              );
              return selectableMoonIds.has(moonId) && onSelectMoon ? (
                <button
                  key={`${planet}-moon-reward-${moonId}`}
                  type='button'
                  data-testid={`moon-block-${planet}-${moonId}`}
                  className={cn(
                    blockClassName,
                    'transition-colors hover:bg-accent-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300',
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectMoon(moonId);
                  }}
                >
                  {content}
                </button>
              ) : (
                <div
                  key={`${planet}-moon-reward-${moonId}`}
                  data-testid={`moon-block-${planet}-${moonId}`}
                  className={blockClassName}
                >
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className='grid grid-cols-2 gap-2'>
        <section className='rounded border border-surface-700/50 bg-surface-800/40 p-2'>
          <p className='mb-1 font-mono text-[10px] uppercase tracking-wider text-text-500'>
            {t('client.planet_card.orbit')}
          </p>
          <div className='flex min-h-5 flex-wrap gap-1'>
            {state.orbitSlots.length === 0 ? (
              <span className='text-[11px] text-text-500'>
                {t('client.common.empty')}
              </span>
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
            {t('client.planet_card.landing')}
          </p>
          <div className='flex min-h-5 flex-wrap gap-1'>
            {state.landingSlots.length === 0 ? (
              <span className='text-[11px] text-text-500'>
                {t('client.common.empty')}
              </span>
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
              {t('client.planet_card.data_slot', { index: index + 1 })}
            </span>
          ))}
        </div>
        <span
          className={cn(
            'rounded border px-1.5 py-0.5 font-mono text-[10px]',
            primaryMoonOccupant
              ? 'border-info-500/70 text-info-300'
              : 'border-surface-600 text-text-500',
          )}
        >
          {t('client.planet_card.moons', { count: planetConfig.moonSlots })}:{' '}
          {primaryMoonOccupant
            ? t('client.planet_card.occupied', {
                player: primaryMoonOccupant.playerId,
              })
            : planetConfig.moonSlots === 0
              ? t('client.common.na')
              : t('client.planet_card.unoccupied')}
        </span>
      </div>

      {planetConfig.moonNames.length > 0 &&
        planetConfig.land.moonRewards.length === 0 && (
          <p className='mt-1 text-[10px] text-text-500'>
            {planetConfig.moonNames.join(', ')}
          </p>
        )}
    </article>
  );
}
