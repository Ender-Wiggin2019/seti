import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  if (model.options.length === 0) {
    return <p className='text-xs text-text-500'>No step is required.</p>;
  }

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [responses, setResponses] = useState<Array<IInputResponse | undefined>>(
    Array.from({ length: model.options.length }),
  );

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
    <div className='space-y-3'>
      <div className='flex items-center justify-between text-xs text-text-400'>
        <span>
          Step {currentStepIndex + 1} / {model.options.length}
        </span>
        {currentStep.title && <span>{currentStep.title}</span>}
      </div>
      <InputRenderer model={currentStep} onSubmit={handleStepSubmit} />
      <div className='flex items-center justify-between'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          disabled={currentStepIndex === 0}
          onClick={() => setCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
        >
          Back
        </Button>
        {responses[currentStepIndex] && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={currentStepIndex >= model.options.length - 1}
            onClick={() =>
              setCurrentStepIndex((prev) =>
                Math.min(prev + 1, model.options.length - 1),
              )
            }
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
