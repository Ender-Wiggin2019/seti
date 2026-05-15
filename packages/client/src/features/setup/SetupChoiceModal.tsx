import { useId } from 'react';
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
  const stepIndex = model.setupChoice?.stepIndex ?? 0;
  const totalSteps = model.setupChoice?.totalSteps ?? 1;
  const titleId = useId();

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby={model.title ? titleId : undefined}
      aria-label={model.title ? undefined : 'Setup Choice'}
      className='space-y-3'
      data-testid='setup-choice-shell'
    >
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='micro-label text-accent-400'>Setup Choice</p>
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
