import { Button } from '@/components/ui/button';
import type {
  IInputResponse,
  ISelectTraceInputModel,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

export interface ISelectTraceInputProps {
  model: ISelectTraceInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectTraceInput({
  model,
  onSubmit,
}: ISelectTraceInputProps): React.JSX.Element {
  return (
    <div className='grid gap-2 sm:grid-cols-2'>
      {model.options.map((trace) => (
        <Button
          key={trace}
          type='button'
          variant='ghost'
          className='justify-start border border-surface-700/60 bg-surface-800/60 text-text-100 hover:bg-surface-700/70'
          onClick={() =>
            onSubmit({
              type: EPlayerInputType.TRACE,
              trace,
            })
          }
        >
          {trace}
        </Button>
      ))}
    </div>
  );
}
