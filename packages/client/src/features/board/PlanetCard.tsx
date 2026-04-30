import type {
  IPlanetMissionConfig,
  TPlanetReward,
} from '@seti/common/constant/boardLayout';
import { EResource, ETrace } from '@seti/common/types/element';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { IPublicPlanetState } from '@/types/re-exports';

interface IPlanetCardProps {
  planet: string;
  config: IPlanetMissionConfig;
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

export function PlanetCard({
  planet,
  config,
  state,
  playerColors,
  isSelectable,
}: IPlanetCardProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const missionConfig = config;
  const firstLandData = formatFirstLandData(missionConfig.land.firstData);

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
          {missionConfig.label}
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

      <div className='mb-2 grid gap-1.5 rounded border border-surface-700/50 bg-surface-950/40 p-2 font-mono text-[10px] leading-snug text-text-300'>
        <p>
          <span className='uppercase tracking-[0.12em] text-text-500'>
            {t('client.planet_card.orbit_reward')}:{' '}
          </span>
          <span className='text-text-100'>
            {formatPlanetRewardList(missionConfig.orbit.rewards)}
          </span>
        </p>
        <p>
          <span className='uppercase tracking-[0.12em] text-text-500'>
            {t('client.planet_card.first_orbit')}:{' '}
          </span>
          <span className='text-text-100'>
            {formatPlanetRewardList(missionConfig.orbit.firstRewards)}
          </span>
        </p>
        <p>
          <span className='uppercase tracking-[0.12em] text-text-500'>
            {t('client.planet_card.land_reward')}:{' '}
          </span>
          <span className='text-text-100'>
            {formatPlanetRewardList(missionConfig.land.rewards)}
          </span>
        </p>
        {firstLandData.length > 0 && (
          <p>
            <span className='uppercase tracking-[0.12em] text-text-500'>
              {t('client.planet_card.first_land_data')}:{' '}
            </span>
            <span className='text-text-100'>{firstLandData}</span>
          </p>
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
            state.moonOccupant
              ? 'border-info-500/70 text-info-300'
              : 'border-surface-600 text-text-500',
          )}
        >
          {t('client.planet_card.moons', { count: missionConfig.moonSlots })}:{' '}
          {state.moonOccupant
            ? t('client.planet_card.occupied', {
                player: state.moonOccupant.playerId,
              })
            : missionConfig.moonSlots === 0
              ? t('client.common.na')
              : t('client.planet_card.unoccupied')}
        </span>
      </div>

      {missionConfig.moonNames.length > 0 && (
        <p className='mt-1 text-[10px] text-text-500'>
          {missionConfig.moonNames.join(', ')}
        </p>
      )}
    </article>
  );
}
