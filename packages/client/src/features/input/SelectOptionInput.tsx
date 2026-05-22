import { DescRender } from '@seti/cards';
import { ORGANIZATIONS_BY_ID } from '@seti/common/data/organizations';
import { PRELUDE_CARDS_BY_ID } from '@seti/common/data/preludeCards';
import { EMiscIcon, EResource } from '@seti/common/types/element';
import type {
  EOrganizationId,
  IOrganizationData,
} from '@seti/common/types/organization';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { QuickStartCardPreview } from '@/features/setup/QuickStartCardPreview';
import { getOrganizationDisplayName } from '@/lib/organizationText';
import type {
  IInputResponse,
  ISelectOptionInputModel,
} from '@/types/re-exports';
import { EPlayerInputType, ESetupChoiceStepKind } from '@/types/re-exports';

export interface ISelectOptionInputProps {
  model: ISelectOptionInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectOptionInput({
  model,
  onSubmit,
}: ISelectOptionInputProps): React.JSX.Element {
  if (model.setupChoice?.kind === ESetupChoiceStepKind.ORGANIZATION) {
    return <OrganizationOptionInput model={model} onSubmit={onSubmit} />;
  }
  if (model.setupChoice?.kind === ESetupChoiceStepKind.QUICK_START_CARDS) {
    return <QuickStartOptionInput model={model} onSubmit={onSubmit} />;
  }

  return (
    <div className='space-y-2'>
      {model.title ? <p className='micro-label'>{model.title}</p> : null}
      <div className='grid gap-1.5 sm:grid-cols-2'>
        {model.options.map((option, index) => (
          <Button
            key={option.id}
            variant='ghost'
            size='sm'
            data-testid={`input-option-${option.id}`}
            className='h-9 justify-start gap-2 px-2.5 text-left text-xs'
            onClick={() =>
              onSubmit({
                inputId: model.inputId,
                type: EPlayerInputType.OPTION,
                optionId: option.id,
              })
            }
          >
            <span
              aria-hidden
              className='font-mono text-[10px] tracking-[0.14em] text-accent-400'
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className='flex-1 truncate font-body text-text-100'>
              {renderOptionLabel(option.label)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Personal-board resource icons used in inline option labels (cost
 * suffixes, reward summaries). Server-side option builders emit
 * emoji shorthand (⚡, 💰, etc.) so the picker stays text-friendly
 * for tests and accessibility; the renderer here swaps them for the
 * same icon files the player dashboard uses, matching the rest of
 * the UI's resource readouts.
 */
const INLINE_ICON_MAP: ReadonlyArray<{ token: string; src: string; alt: string }> = [
  { token: '⚡', src: '/assets/seti/icons/energy.png', alt: 'energy' },
  { token: '💰', src: '/assets/seti/icons/money.png', alt: 'credits' },
];

function renderOptionLabel(label: string): React.ReactNode {
  // Build a regex that captures any of the known emoji tokens so we
  // can splice them out and render an <img> in their place. Anything
  // not matching a known token (planet names, rewards copy) renders
  // as plain text.
  //
  // The `u` flag is required: 💰 (U+1F4B0) and other astral-plane
  // emoji are surrogate pairs in JS strings, and without `u` a
  // character class `[💰⚡]` would treat the surrogate halves as
  // independent code units instead of one codepoint per emoji.
  // That left "💰" rendering as the raw emoji glyph because the
  // splitter never matched it as a whole token.
  if (INLINE_ICON_MAP.length === 0) return label;
  const tokens = INLINE_ICON_MAP.map(({ token }) => token).join('');
  const splitter = new RegExp(`([${tokens}])`, 'gu');
  const parts = label.split(splitter);
  return (
    <>
      {parts.map((part, index) => {
        const icon = INLINE_ICON_MAP.find(({ token }) => token === part);
        if (icon) {
          return (
            <img
              key={`icon-${index}`}
              src={icon.src}
              alt={icon.alt}
              className='inline-block h-3.5 w-3.5 align-text-bottom'
              aria-hidden
            />
          );
        }
        return <span key={`text-${index}`}>{part}</span>;
      })}
    </>
  );
}

function QuickStartOptionInput({
  model,
  onSubmit,
}: ISelectOptionInputProps): React.JSX.Element {
  return (
    <div className='space-y-2'>
      {model.title ? <p className='micro-label'>{model.title}</p> : null}
      <div className='grid gap-2 md:grid-cols-2 xl:grid-cols-3'>
        {model.options.map((option) => {
          const card = PRELUDE_CARDS_BY_ID[option.id];
          if (!card) {
            return (
              <Button
                key={option.id}
                variant='ghost'
                size='sm'
                data-testid={`input-option-${option.id}`}
                className='h-9 justify-start gap-2 px-2.5 text-left text-xs'
                onClick={() =>
                  onSubmit({
                    inputId: model.inputId,
                    type: EPlayerInputType.OPTION,
                    optionId: option.id,
                  })
                }
              >
                {option.label}
              </Button>
            );
          }

          return (
            <Button
              key={option.id}
              variant='ghost'
              size='sm'
              data-testid={`input-option-${option.id}`}
              className='h-auto items-stretch justify-start px-2 py-2 text-left'
              onClick={() =>
                onSubmit({
                  inputId: model.inputId,
                  type: EPlayerInputType.OPTION,
                  optionId: option.id,
                })
              }
            >
              <QuickStartCardPreview card={card} />
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function setupToken(type: string, amount: number): string | null {
  return amount > 0 ? `{${type}-${amount}}` : null;
}

function organizationSetupDesc(organization: IOrganizationData): string {
  return [
    setupToken(EResource.CREDIT, organization.resources.credit),
    setupToken(EResource.ENERGY, organization.resources.energy),
    setupToken(EResource.CARD, organization.resources.card),
    setupToken(EResource.PUBLICITY, organization.resources.publicity),
    setupToken(EResource.DATA, organization.resources.data),
    setupToken(EMiscIcon.INCOME, organization.tuckIncome),
  ]
    .filter((token): token is string => token !== null)
    .join(' ');
}

function plural(amount: number, singular: string, pluralName = `${singular}s`) {
  return `${amount} ${amount === 1 ? singular : pluralName}`;
}

function organizationSetupSummary(organization: IOrganizationData): string {
  return [
    plural(organization.resources.credit, 'credit'),
    plural(organization.resources.energy, 'energy', 'energy'),
    plural(organization.resources.card, 'card'),
    `${organization.resources.publicity} publicity`,
    `${organization.resources.data} data`,
    plural(organization.tuckIncome, 'tuck income card'),
  ].join(', ');
}

function OrganizationOptionInput({
  model,
  onSubmit,
}: ISelectOptionInputProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <div className='space-y-2'>
      {model.title ? <p className='micro-label'>{model.title}</p> : null}
      <div className='grid gap-2 md:grid-cols-2 xl:grid-cols-3'>
        {model.options.map((option) => {
          const organization =
            ORGANIZATIONS_BY_ID[option.id as EOrganizationId];
          const organizationName = organization
            ? getOrganizationDisplayName(t, organization.id)
            : option.label;
          return (
            <Button
              key={option.id}
              variant='ghost'
              size='sm'
              data-testid={`input-option-${option.id}`}
              className='h-auto min-h-20 items-stretch justify-start px-3 py-2 text-left'
              onClick={() =>
                onSubmit({
                  inputId: model.inputId,
                  type: EPlayerInputType.OPTION,
                  optionId: option.id,
                })
              }
            >
              <span className='flex w-full flex-col gap-1.5'>
                <span className='flex items-center justify-between gap-2'>
                  <span className='truncate font-body text-sm font-semibold text-text-100'>
                    {organizationName}
                  </span>
                  <span
                    aria-hidden
                    className='chip shrink-0 font-mono text-[9px] tracking-[0.14em]'
                  >
                    {t('client.organizations.setup_badge')}
                  </span>
                </span>
                {organization ? (
                  <>
                    <div
                      aria-hidden
                      className='flex min-h-8 items-center justify-start rounded border border-surface-200/40 bg-surface-900/35 px-1.5 py-1'
                    >
                      <DescRender
                        desc={organizationSetupDesc(organization)}
                        size='desc-mini'
                        smartSize
                        width='half'
                      />
                    </div>
                    <span className='sr-only'>
                      {t('client.organizations.setup_summary', {
                        credit: organization.resources.credit,
                        energy: organization.resources.energy,
                        card: organization.resources.card,
                        publicity: organization.resources.publicity,
                        data: organization.resources.data,
                        tuckIncome: organization.tuckIncome,
                        defaultValue: `Setup: ${organizationSetupSummary(
                          organization,
                        )}`,
                      })}
                    </span>
                  </>
                ) : null}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
