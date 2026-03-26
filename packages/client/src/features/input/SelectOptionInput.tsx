import { Button } from '@/components/ui/button';
import type {
  IInputResponse,
  ISelectOptionInputModel,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

export interface ISelectOptionInputProps {
  model: ISelectOptionInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectOptionInput({
  model,
  onSubmit,
}: ISelectOptionInputProps): React.JSX.Element {
  return (
    <div className='space-y-2'>
      {model.title && (
        <p className='font-mono text-xs uppercase tracking-wider text-text-400'>
          {model.title}
        </p>
      )}
      <div className='grid gap-2 sm:grid-cols-2'>
        {model.options.map((option) => (
          <Button
            key={option.id}
            type='button'
            variant='ghost'
            className='justify-start border border-surface-700/60 bg-surface-800/60 text-text-100 hover:bg-surface-700/70'
            onClick={() =>
              onSubmit({
                type: EPlayerInputType.OPTION,
                optionId: option.id,
              })
            }
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
