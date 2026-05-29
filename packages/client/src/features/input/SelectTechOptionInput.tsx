import {
  ALL_TECH_IDS,
  type ETechId,
  getTechDescriptor,
} from '@seti/common/types/tech';
import { getTechPresentation } from '@seti/common/types/techPresentation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { getTechBonusPresentation } from '@/features/tech/techBonusPresentation';
import { getTechTileImageById } from '@/features/tech/techTileImages';
import { cn } from '@/lib/cn';
import type {
  IInputResponse,
  IPublicTechBoard,
  ISelectOptionInputModel,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { translateInputText } from './inputI18n';

const ALL_TECH_ID_SET = new Set<string>(ALL_TECH_IDS);

export function isTechOptionInput(model: ISelectOptionInputModel): boolean {
  return (
    model.options.length > 0 &&
    model.options.every((option) => ALL_TECH_ID_SET.has(option.id))
  );
}

export interface ISelectTechOptionInputProps {
  model: ISelectOptionInputModel;
  onSubmit: (response: IInputResponse) => void;
  techBoard?: IPublicTechBoard;
}

export function SelectTechOptionInput({
  model,
  onSubmit,
  techBoard,
}: ISelectTechOptionInputProps): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-2'>
      {model.title ? (
        <p className='micro-label'>{translateInputText(t, model.title)}</p>
      ) : null}
      <div className='grid max-h-[220px] gap-1.5 overflow-auto sm:grid-cols-2 lg:grid-cols-3'>
        {model.options.map((option) => {
          const techId = option.id as ETechId;
          const descriptor = getTechDescriptor(techId);
          const presentation = getTechPresentation(techId);
          const label = t(presentation.i18nKey, {
            defaultValue: presentation.fallback,
          });
          const stack = techBoard?.stacks.find(
            (candidate) =>
              candidate.tech === descriptor.type &&
              candidate.level === descriptor.level,
          );

          return (
            <Button
              key={option.id}
              variant='ghost'
              size='sm'
              data-testid={`input-option-${option.id}`}
              className='h-auto min-h-[5rem] justify-start gap-2 px-2 py-1.5 text-left whitespace-normal'
              onClick={() =>
                onSubmit({
                  inputId: model.inputId,
                  type: EPlayerInputType.OPTION,
                  optionId: option.id,
                })
              }
            >
              <img
                src={getTechTileImageById(techId)}
                alt={label}
                data-testid={`input-tech-tile-${option.id}`}
                className='aspect-[197/276] h-14 shrink-0 rounded-[3px] border border-surface-700/60 bg-background-950/40 object-contain'
              />
              <span className='flex min-w-0 flex-col gap-0.5'>
                <span className='truncate font-body text-xs font-semibold text-text-100'>
                  {label}
                </span>
                <span className='font-mono text-[9px] uppercase tracking-[0.12em] text-text-500'>
                  L{descriptor.level + 1} | {option.id}
                </span>
                {stack ? (
                  <span className='mt-0.5 flex flex-wrap items-center gap-1'>
                    <span
                      data-testid={`input-tech-first-bonus-${option.id}`}
                      className={cn(
                        'rounded border px-1 py-0.5 font-mono text-[9px]',
                        stack.firstTakeBonusAvailable
                          ? 'border-accent-500/70 text-accent-300'
                          : 'border-surface-600 text-text-500',
                      )}
                    >
                      {t('client.tech_stack.first_take_bonus', {
                        status: stack.firstTakeBonusAvailable
                          ? t('client.tech_stack.available')
                          : t('client.tech_stack.taken'),
                      })}
                    </span>
                    {(stack.topTileBonuses ?? []).map((bonus, index) => {
                      const meta = getTechBonusPresentation(bonus);
                      const localizedLabel = meta.labelKey
                        ? t(meta.labelKey, {
                            type: bonus.type,
                            defaultValue: meta.label,
                          })
                        : meta.label;
                      return (
                        <span
                          key={`${option.id}-bonus-${bonus.type}-${index}`}
                          data-testid={`input-tech-back-bonus-${option.id}-${index}`}
                          className='inline-flex h-5 min-w-5 items-center justify-center rounded border border-surface-700/70 bg-background-950/60 px-1 font-mono text-[8px] text-text-200'
                          title={localizedLabel}
                          aria-label={localizedLabel}
                        >
                          {meta.src ? (
                            <img
                              src={meta.src}
                              alt={localizedLabel}
                              className='h-4 w-4 object-contain'
                            />
                          ) : (
                            meta.shortLabel
                          )}
                        </span>
                      );
                    })}
                  </span>
                ) : null}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
