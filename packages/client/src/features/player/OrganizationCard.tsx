import { ORGANIZATIONS_BY_ID } from '@seti/common/data/organizations';
import { EResource, ETech } from '@seti/common/types/element';
import {
  EOrganizationId,
  type IOrganizationAbilityText,
} from '@seti/common/types/organization';
import { useTranslation } from 'react-i18next';
import { HotspotAnchor } from '@/features/hotspots/HotspotAnchor';
import { HotspotButton } from '@/features/hotspots/HotspotButton';
import { cn } from '@/lib/cn';
import { getOrganizationDisplayName } from '@/lib/organizationText';
import { useTextMode } from '@/stores/debugStore';

interface IOrganizationCardProps {
  organizationId: EOrganizationId;
  available: boolean;
  used: boolean;
  state?: Record<string, unknown>;
  onUse: (organizationId: EOrganizationId) => void;
}

const ABILITY_LABEL_KEYS = {
  setup: {
    key: 'client.organizations.setup_ability_label',
    defaultValue: 'Setup',
  },
  passive: {
    key: 'client.organizations.passive_label',
    defaultValue: 'Passive',
  },
  freeAction: {
    key: 'Free Action',
    defaultValue: 'Free Action',
  },
  mainAction: {
    key: 'client.organizations.main_action_label',
    defaultValue: 'Main Action',
  },
} as const;

type TAbilityKey = keyof typeof ABILITY_LABEL_KEYS;
type TOrganizationMarkEntry = {
  id: string;
  label: string;
  marked: boolean;
};

const COSMOS_MARK_REWARDS = [
  EResource.CREDIT,
  EResource.PUBLICITY,
  EResource.DATA,
] as const;

const HELION_MARK_CATEGORIES = [
  ETech.PROBE,
  ETech.SCAN,
  ETech.COMPUTER,
] as const;

const ORGANIZATION_MARK_LABELS: Record<string, string> = {
  [EResource.CREDIT]: 'Credit',
  [EResource.PUBLICITY]: 'Publicity',
  [EResource.DATA]: 'Data',
  [ETech.PROBE]: 'Probe',
  [ETech.SCAN]: 'Scan',
  [ETech.COMPUTER]: 'Computer',
};

function getAbilityEntries(
  abilityText: IOrganizationAbilityText,
): Array<{ key: TAbilityKey; text: string }> {
  return (['setup', 'passive', 'freeAction', 'mainAction'] as const).flatMap(
    (key) => {
      const text = abilityText[key];
      return text ? [{ key, text }] : [];
    },
  );
}

function getOrganizationMarkEntries(
  organizationId: EOrganizationId,
  state: Record<string, unknown> | undefined,
): TOrganizationMarkEntry[] {
  if (organizationId === EOrganizationId.COSMOS_STRATEGY_GROUP) {
    const markedRewards = getRecord(state?.markedRewards);
    return COSMOS_MARK_REWARDS.map((reward) => ({
      id: reward,
      label: ORGANIZATION_MARK_LABELS[reward],
      marked: markedRewards?.[reward] === true,
    }));
  }

  if (organizationId === EOrganizationId.HELION_ASSEMBLY) {
    const markedCategories = state?.markedCategories;
    return HELION_MARK_CATEGORIES.map((category) => ({
      id: category,
      label: ORGANIZATION_MARK_LABELS[category],
      marked:
        Array.isArray(markedCategories) && markedCategories.includes(category),
    }));
  }

  return [];
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

export function OrganizationCard({
  organizationId,
  available,
  used,
  state,
  onUse,
}: IOrganizationCardProps): React.JSX.Element | null {
  const { t } = useTranslation('common');
  const textMode = useTextMode();
  const organization = ORGANIZATIONS_BY_ID[organizationId];

  if (!organization) {
    return null;
  }

  const name = getOrganizationDisplayName(t, organizationId);
  const reference = organization.frontendReference;
  const abilityEntries = getAbilityEntries(organization.abilityText);
  const markEntries = getOrganizationMarkEntries(organizationId, state);
  const canUse = available && !used;

  if (textMode) {
    return (
      <article
        className='flex min-h-[178px] w-[220px] shrink-0 flex-col overflow-hidden rounded-sm border border-accent-700/60 bg-surface-950/95 font-mono text-[10px] text-text-100 shadow-sm'
        data-testid={`organization-card-${organizationId}`}
      >
        <div className='border-b border-surface-700/70 px-2.5 py-2'>
          <h3 className='truncate text-[13px] font-bold uppercase tracking-wide text-text-50'>
            {name}
          </h3>
        </div>
        <div className='min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 py-2'>
          {abilityEntries.map((entry) => (
            <section key={entry.key}>
              <p className='mb-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-accent-300'>
                {t(ABILITY_LABEL_KEYS[entry.key].key, {
                  defaultValue: ABILITY_LABEL_KEYS[entry.key].defaultValue,
                })}
              </p>
              <p className='text-[9px] leading-snug text-text-300'>
                {entry.text}
              </p>
            </section>
          ))}
          {markEntries.length > 0 ? (
            <section data-testid={`organization-status-${organizationId}`}>
              <p className='mb-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-accent-300'>
                Reward marks
              </p>
              <div className='grid grid-cols-1 gap-1'>
                {markEntries.map((entry) => (
                  <span
                    key={entry.id}
                    className={cn(
                      'flex items-center justify-between rounded-sm border px-1.5 py-1 text-[8px] uppercase tracking-[0.12em]',
                      entry.marked
                        ? 'border-accent-400/70 bg-accent-500/15 text-accent-100'
                        : 'border-surface-700/70 bg-surface-900/60 text-text-500',
                    )}
                    data-testid={`organization-mark-${organizationId}-${entry.id}`}
                  >
                    <span>{entry.label}</span>
                    <span>{entry.marked ? 'marked' : 'open'}</span>
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
        <div className='border-t border-surface-700/70 p-2'>
          <div className='relative h-7 w-full'>
            <HotspotButton
              sceneId='corporation-board'
              hotspotId={`${organizationId}-power`}
              variant='text'
              baseWidth={204}
              baseHeight={28}
              x={102}
              y={14}
              width={204}
              height={28}
              shape='rect'
              debugLabel={`${name} power`}
              ariaLabel={`${name} ${t('client.free_action_bar.actions.USE_ORGANIZATION_POWER')}`}
              disabled={!canUse}
              onClick={() => onUse(organizationId)}
              className='flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.12em]'
              testId={`organization-power-card-${organizationId}`}
            >
              {used
                ? t('client.organizations.power_used')
                : t('client.free_action_bar.actions.USE_ORGANIZATION_POWER')}
            </HotspotButton>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className='relative h-[234px] w-[168px] shrink-0 overflow-hidden rounded-sm border border-accent-700/55 bg-surface-950 shadow-sm'
      data-testid={`organization-card-${organizationId}`}
    >
      <img
        alt={reference.displayName}
        className='absolute inset-0 h-full w-full object-cover opacity-75'
        src={`/assets/seti/${reference.image}`}
      />
      <div className='absolute inset-0 bg-gradient-to-b from-background-950/75 via-background-950/45 to-background-950/85' />
      <div className='relative flex h-full flex-col p-2.5 text-text-50'>
        <h3 className='text-[15px] font-bold uppercase leading-tight tracking-wide drop-shadow'>
          {name}
        </h3>
        <div className='my-2 h-px bg-text-100/45' />
        <div className='min-h-0 flex-1 space-y-1.5 overflow-y-auto pb-12 pr-1'>
          {abilityEntries.map((entry) => (
            <section key={entry.key}>
              <p className='text-[8px] font-semibold uppercase tracking-[0.16em] text-accent-200'>
                {t(ABILITY_LABEL_KEYS[entry.key].key, {
                  defaultValue: ABILITY_LABEL_KEYS[entry.key].defaultValue,
                })}
              </p>
              <p className='mt-1 rounded-sm bg-background-950/55 p-1.5 text-[9px] leading-snug text-text-100'>
                {entry.text}
              </p>
            </section>
          ))}
        </div>
        <HotspotButton
          sceneId='corporation-board'
          hotspotId={`${organizationId}-power`}
          variant='image'
          baseWidth={168}
          baseHeight={234}
          x={42}
          y={210}
          width={80}
          height={44}
          disabled={!canUse}
          onClick={() => onUse(organizationId)}
          ariaLabel={`${name} ${t('client.free_action_bar.actions.USE_ORGANIZATION_POWER')}`}
          debugLabel={`${name} power`}
          className={cn(
            'flex items-center justify-center rounded-full border font-mono text-[8px] uppercase tracking-[0.1em] transition',
            canUse
              ? 'border-accent-300 bg-accent-500/85 text-background-950 hover:bg-accent-300'
              : 'cursor-not-allowed border-surface-500 bg-surface-900/75 text-text-500',
          )}
          testId={`organization-power-card-${organizationId}`}
        >
          {t('client.free_action_bar.actions.USE_ORGANIZATION_POWER')}
        </HotspotButton>
      </div>
      {used ? (
        <HotspotAnchor
          sceneId='corporation-board'
          hotspotId={`${organizationId}-used-badge`}
          variant='image'
          baseWidth={168}
          baseHeight={234}
          x={48}
          y={194}
          width={56}
          height={56}
          color='#facc15'
          debugLabel={`${name} used badge`}
          className='rounded-full'
          testId={`organization-used-badge-${organizationId}`}
        >
          <div className='flex h-full w-full items-center justify-center rounded-full border border-accent-200 bg-background-950/90 font-mono text-[9px] uppercase tracking-[0.12em] text-accent-200 shadow-[0_0_18px_oklch(0.68_0.11_240/0.45)]'>
            {t('client.organizations.power_used')}
          </div>
        </HotspotAnchor>
      ) : null}
    </article>
  );
}
