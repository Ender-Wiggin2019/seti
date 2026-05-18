import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { InputRenderer } from '@/features/input/InputRenderer';
import type { IInputResponse, IPlayerInputModel } from '@/types/re-exports';

interface ISetupChoiceModalProps {
  model: IPlayerInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SetupChoiceModal({
  model,
  onSubmit,
}: ISetupChoiceModalProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const stepIndex = model.setupChoice?.stepIndex ?? 0;
  const totalSteps = model.setupChoice?.totalSteps ?? 1;
  const titleId = useId();
  const fallbackTitle = t('client.setup_choice.title');

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby={model.title ? titleId : undefined}
      aria-label={model.title ? undefined : fallbackTitle}
      className='space-y-3'
      data-testid='setup-choice-shell'
    >
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='micro-label text-accent-400'>{fallbackTitle}</p>
          {model.title ? (
            <h3
              id={titleId}
              className='font-body text-sm font-semibold text-text-100'
            >
              {model.title}
            </h3>
          ) : null}
        </div>
        <span className='readout text-xs text-text-400'>
          {stepIndex + 1} / {totalSteps}
        </span>
      </div>
      <InputRenderer model={model} onSubmit={onSubmit} />
    </div>
  );
}
