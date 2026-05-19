import { DescRender } from '@seti/cards';
import { ORGANIZATIONS_BY_ID } from '@seti/common/data/organizations';
import type { EOrganizationId } from '@seti/common/types/organization';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { getOrganizationDisplayName } from '@/lib/organizationText';
import { useTextMode } from '@/stores/debugStore';

interface IOrganizationCardProps {
  organizationId: EOrganizationId;
  available: boolean;
  used: boolean;
  onUse: (organizationId: EOrganizationId) => void;
}

const ABILITY_FALLBACKS: Record<
  EOrganizationId,
  { passive: string; freeAction: string }
> = {
  'cosmos-strategy-group': {
    passive:
      "When you play a card as a main action, mark one matching reward space if the card's sector color matches.",
    freeAction: 'Gain 1 card, then clear all marked reward spaces.',
  },
  'deep-sky-survey': {
    passive: "You don't need energy to perform Analyze Data.",
    freeAction: 'Switch a card from your hand with a card on the card row.',
  },
  'fenwick-research-center': {
    passive: 'Your publicity engine is tuned for stronger research funding.',
    freeAction: 'Use the once-per-round organization power.',
  },
  'futurespan-institute': {
    passive: 'Prepare and unlock future cards through this organization.',
    freeAction: 'Use the once-per-round organization power.',
  },
  'helion-assembly': {
    passive: 'Improve tech access through this organization.',
    freeAction: 'Use the once-per-round organization power.',
  },
  'mission-relay': {
    passive: 'Gain benefits as you complete mission cards.',
    freeAction: 'Use the once-per-round organization power.',
  },
  'orbital-dynamics': {
    passive: 'Improve probe launch and movement tempo.',
    freeAction: 'Use the once-per-round organization power.',
  },
  'sentinel-probe-network': {
    passive: 'Track card-corner free actions for a follow-up signal benefit.',
    freeAction: 'Use the once-per-round organization power.',
  },
  'stratus-core': {
    passive: 'Improve card-row offer effects.',
    freeAction: 'Use the once-per-round organization power.',
  },
  'turing-systems': {
    passive: 'Improve tech testing and data tempo.',
    freeAction: 'Use the once-per-round organization power.',
  },
  xenolab: {
    passive: 'Improve alien trace development.',
    freeAction: 'Use the once-per-round organization power.',
  },
};

export function OrganizationCard({
  organizationId,
  available,
  used,
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
  const passive = t(
    `client.organizations.abilities.${organizationId}.passive`,
    {
      defaultValue: ABILITY_FALLBACKS[organizationId].passive,
    },
  );
  const freeAction = t(
    `client.organizations.abilities.${organizationId}.free_action`,
    { defaultValue: ABILITY_FALLBACKS[organizationId].freeAction },
  );
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
          <section>
            <p className='mb-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-accent-300'>
              {t('client.organizations.effect_label')}
            </p>
            <DescRender desc={passive} size='desc-mini' smartSize />
          </section>
          <section>
            <p className='mb-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-accent-300'>
              {t('Free Action')}
            </p>
            <p className='text-[9px] leading-snug text-text-300'>
              {freeAction}
            </p>
          </section>
        </div>
        <div className='border-t border-surface-700/70 p-2'>
          <Button
            size='sm'
            disabled={!canUse}
            onClick={() => onUse(organizationId)}
            className='h-7 w-full font-mono text-[10px] uppercase tracking-[0.12em]'
            data-testid={`organization-power-card-${organizationId}`}
          >
            {used
              ? t('client.organizations.power_used')
              : t('client.free_action_bar.actions.USE_ORGANIZATION_POWER')}
          </Button>
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
        <p className='text-[8px] font-semibold uppercase tracking-[0.16em] text-accent-200'>
          {t('client.organizations.effect_label')} (
          {t('client.organizations.passive_label')})
        </p>
        <div className='mt-1 rounded-sm bg-background-950/55 p-1.5 text-[9px] leading-snug text-text-100'>
          <DescRender desc={passive} size='desc-mini' smartSize />
        </div>
        <div className='my-2 h-px bg-text-100/35' />
        <p className='text-[8px] font-semibold uppercase tracking-[0.16em] text-accent-200'>
          {t('Free Action')}
        </p>
        <p className='mt-1 line-clamp-3 text-[9px] leading-snug text-text-200'>
          {freeAction}
        </p>
        <button
          type='button'
          disabled={!canUse}
          onClick={() => onUse(organizationId)}
          aria-label={`${name} ${t('client.free_action_bar.actions.USE_ORGANIZATION_POWER')}`}
          className={cn(
            'absolute bottom-2 left-2 flex h-11 w-20 items-center justify-center rounded-full border font-mono text-[8px] uppercase tracking-[0.1em] transition',
            canUse
              ? 'border-accent-300 bg-accent-500/85 text-background-950 hover:bg-accent-300'
              : 'cursor-not-allowed border-surface-500 bg-surface-900/75 text-text-500',
          )}
          data-testid={`organization-power-card-${organizationId}`}
        >
          {t('client.free_action_bar.actions.USE_ORGANIZATION_POWER')}
        </button>
      </div>
      {used ? (
        <div className='absolute bottom-3 left-5 flex h-14 w-14 items-center justify-center rounded-full border border-accent-200 bg-background-950/90 font-mono text-[9px] uppercase tracking-[0.12em] text-accent-200 shadow-[0_0_18px_oklch(0.68_0.11_240/0.45)]'>
          {t('client.organizations.power_used')}
        </div>
      ) : null}
    </article>
  );
}
