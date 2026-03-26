import { Button } from '@/components/ui/button';
import type {
  IInputResponse,
  ISelectResourceInputModel,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

export interface ISelectResourceInputProps {
  model: ISelectResourceInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectResourceInput({
  model,
  onSubmit,
}: ISelectResourceInputProps): React.JSX.Element {
  return (
    <div className='grid gap-2 sm:grid-cols-2'>
      {model.options.map((resource) => (
        <Button
          key={resource}
          type='button'
          variant='ghost'
          className='justify-start border border-surface-700/60 bg-surface-800/60 text-text-100 hover:bg-surface-700/70'
          onClick={() =>
            onSubmit({
              type: EPlayerInputType.RESOURCE,
              resource,
            })
          }
        >
          {resource}
        </Button>
      ))}
    </div>
  );
}
