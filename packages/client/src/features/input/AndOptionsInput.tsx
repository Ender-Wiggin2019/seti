import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { IAndOptionsInputModel, IInputResponse } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { InputRenderer } from './InputRenderer';

export interface IAndOptionsInputProps {
  model: IAndOptionsInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function AndOptionsInput({
  model,
  onSubmit,
}: IAndOptionsInputProps): React.JSX.Element {
  const { t } = useTranslation('common');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [responses, setResponses] = useState<Array<IInputResponse | undefined>>(
    () => Array.from({ length: model.options.length }),
  );

  useEffect(() => {
    setCurrentStepIndex(0);
    setResponses(Array.from({ length: model.options.length }));
  }, [model.inputId, model.options.length]);

  if (model.options.length === 0) {
    return (
      <p className='text-xs text-text-500'>
        {t('client.input.no_step_required')}
      </p>
    );
  }

  const currentStep = model.options[currentStepIndex];

  function handleStepSubmit(response: IInputResponse): void {
    const nextResponses = [...responses];
    nextResponses[currentStepIndex] = response;
    setResponses(nextResponses);

    if (currentStepIndex < model.options.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      return;
    }

    const completedResponses = nextResponses.filter(
      (item): item is IInputResponse => Boolean(item),
    );
    onSubmit({
      type: EPlayerInputType.AND,
      responses: completedResponses,
    });
  }

  return (
    <div className='space-y-2.5'>
      <div className='flex items-center gap-2'>
        <span aria-hidden className='section-head__tick' />
        <p className='font-mono text-[11px] uppercase tracking-[0.12em] text-text-300'>
          {t('client.input.step', {
            current: currentStepIndex + 1,
            total: model.options.length,
          })}
        </p>
        <div aria-hidden className='section-head__rule' />
        {currentStep.title ? (
          <span className='font-mono text-[10px] uppercase tracking-[0.12em] text-text-500'>
            {currentStep.title}
          </span>
        ) : null}
      </div>

      <div
        className='flex items-center gap-1'
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={model.options.length}
        aria-valuenow={currentStepIndex + 1}
      >
        {model.options.map((_, index) => {
          const done = responses[index] !== undefined;
          const active = index === currentStepIndex;
          return (
            <span
              key={index}
              className={cn(
                'h-[3px] flex-1 rounded-full',
                done
                  ? 'bg-accent-500/70'
                  : active
                    ? 'bg-text-100/60'
                    : 'bg-surface-700/70',
              )}
            />
          );
        })}
      </div>

      <InputRenderer model={currentStep} onSubmit={handleStepSubmit} />

      <div className='flex items-center justify-between'>
        <Button
          variant='ghost'
          size='sm'
          disabled={currentStepIndex === 0}
          onClick={() => setCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
        >
          <span
            aria-hidden
            className='mr-1 inline-block h-0 w-0 border-y-[4px] border-r-[5px] border-y-transparent border-r-current'
          />
          {t('client.common.back')}
        </Button>
        {responses[currentStepIndex] && (
          <Button
            variant='ghost'
            size='sm'
            disabled={currentStepIndex >= model.options.length - 1}
            onClick={() =>
              setCurrentStepIndex((prev) =>
                Math.min(prev + 1, model.options.length - 1),
              )
            }
          >
            {t('client.common.next')}
            <span
              aria-hidden
              className='ml-1 inline-block h-0 w-0 border-y-[4px] border-l-[5px] border-y-transparent border-l-current'
            />
          </Button>
        )}
      </div>
    </div>
  );
}
