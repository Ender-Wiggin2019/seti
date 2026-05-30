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

const ORGANIZATION_IMAGE_BASE_WIDTH = 671;
const ORGANIZATION_IMAGE_BASE_HEIGHT = 507;
const ORGANIZATION_IMAGE_POWER_CONFIG: Record<
  string,
  { xPercent: number; yPercent: number }
> = {
  cards: { xPercent: 10, yPercent: 90 },
  look: { xPercent: 10, yPercent: 90 },
  publ: { xPercent: 10, yPercent: 87 },
  probes: { xPercent: 10, yPercent: 90 },
  offerEffects: { xPercent: 10, yPercent: 87 },
  probeSignal: { xPercent: 10, yPercent: 90 },
  sponsoring: { xPercent: 10, yPercent: 92 },
  techSeller: { xPercent: 5, yPercent: 85 },
  testTech: { xPercent: 10, yPercent: 80 },
  missions: { xPercent: 10, yPercent: 85 },
  traces: { xPercent: 10, yPercent: 90 },
};

const ORGANIZATION_MARK_LABEL_KEYS: Record<
  string,
  { key: string; defaultValue: string }
> = {
  [EResource.CREDIT]: {
    key: 'client.organizations_card.marks.credit',
    defaultValue: 'Credit',
  },
  [EResource.PUBLICITY]: {
    key: 'client.organizations_card.marks.publicity',
    defaultValue: 'Publicity',
  },
  [EResource.DATA]: {
    key: 'client.organizations_card.marks.data',
    defaultValue: 'Data',
  },
  [ETech.PROBE]: {
    key: 'client.organizations_card.marks.probe',
    defaultValue: 'Probe',
  },
  [ETech.SCAN]: {
    key: 'client.organizations_card.marks.scan',
    defaultValue: 'Scan',
  },
  [ETech.COMPUTER]: {
    key: 'client.organizations_card.marks.computer',
    defaultValue: 'Computer',
  },
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
  t: (key: string, opts?: Record<string, unknown>) => string,
): TOrganizationMarkEntry[] {
  if (organizationId === EOrganizationId.COSMOS_STRATEGY_GROUP) {
    const markedRewards = getRecord(state?.markedRewards);
    return COSMOS_MARK_REWARDS.map((reward) => {
      const meta = ORGANIZATION_MARK_LABEL_KEYS[reward];
      return {
        id: reward,
        label: t(meta.key, { defaultValue: meta.defaultValue }),
        marked: markedRewards?.[reward] === true,
      };
    });
  }

  if (organizationId === EOrganizationId.HELION_ASSEMBLY) {
    const markedCategories = state?.markedCategories;
    return HELION_MARK_CATEGORIES.map((category) => {
      const meta = ORGANIZATION_MARK_LABEL_KEYS[category];
      return {
        id: category,
        label: t(meta.key, { defaultValue: meta.defaultValue }),
        marked:
          Array.isArray(markedCategories) &&
          markedCategories.includes(category),
      };
    });
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
  const markEntries = getOrganizationMarkEntries(organizationId, state, t);
  const canUse = available && !used;
  const imagePowerConfig =
    ORGANIZATION_IMAGE_POWER_CONFIG[reference.type] ??
    ORGANIZATION_IMAGE_POWER_CONFIG.probes;
  const imageAbilitySummary = abilityEntries
    .map((entry) => entry.text)
    .join(' ');

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
                {t('client.organizations_card.reward_marks', {
                  defaultValue: 'Reward marks',
                })}
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
                    <span>
                      {entry.marked
                        ? t('client.organizations_card.marked', {
                            defaultValue: 'marked',
                          })
                        : t('client.organizations_card.open', {
                            defaultValue: 'open',
                          })}
                    </span>
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
        <div className='border-t border-surface-700/70 p-2'>
          <div className='relative h-7 w-full'>
            <HotspotAnchor
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
              testId={`organization-power-anchor-${organizationId}`}
            />
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
      className='relative aspect-[671/507] w-[220px] shrink-0 overflow-hidden rounded-sm border border-accent-700/55 bg-surface-950 shadow-sm'
      data-testid={`organization-card-${organizationId}`}
      title={imageAbilitySummary || name}
    >
      <img
        alt={reference.displayName}
        className='absolute inset-0 h-full w-full object-cover opacity-75'
        src={`/assets/seti/${reference.image}`}
      />
      <div className='absolute inset-0 bg-gradient-to-b from-background-950/75 via-background-950/45 to-background-950/85' />
      <div className='relative flex h-full flex-col p-2.5 text-text-50'>
        <div className='flex-1' />
        <HotspotAnchor
          sceneId='corporation-board'
          hotspotId={`${organizationId}-power`}
          variant='image'
          baseWidth={ORGANIZATION_IMAGE_BASE_WIDTH}
          baseHeight={ORGANIZATION_IMAGE_BASE_HEIGHT}
          x={0}
          y={0}
          xPercent={imagePowerConfig.xPercent}
          yPercent={imagePowerConfig.yPercent}
          width={76}
          height={76}
          debugLabel={`${name} use marker`}
          testId={`organization-power-anchor-${organizationId}`}
        />
        <HotspotButton
          sceneId='corporation-board'
          hotspotId={`${organizationId}-power`}
          variant='image'
          baseWidth={ORGANIZATION_IMAGE_BASE_WIDTH}
          baseHeight={ORGANIZATION_IMAGE_BASE_HEIGHT}
          x={0}
          y={0}
          xPercent={imagePowerConfig.xPercent}
          yPercent={imagePowerConfig.yPercent}
          width={76}
          height={76}
          disabled={!canUse}
          onClick={() => onUse(organizationId)}
          ariaLabel={`${name} ${t('client.free_action_bar.actions.USE_ORGANIZATION_POWER')}`}
          debugLabel={`${name} use marker`}
          className={cn(
            'flex items-center justify-center rounded-full border font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition',
            canUse
              ? 'border-accent-200/80 bg-surface-950/70 text-text-100 shadow-[0_0_18px_rgba(249,115,22,0.22)]'
              : 'cursor-not-allowed border-surface-500/90 bg-surface-950/75 text-text-400',
          )}
          testId={`organization-power-card-${organizationId}`}
        >
          <span className='leading-none'>1x</span>
        </HotspotButton>
      </div>
    </article>
  );
}
