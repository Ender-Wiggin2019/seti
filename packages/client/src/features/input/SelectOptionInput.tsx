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
              {option.label}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
