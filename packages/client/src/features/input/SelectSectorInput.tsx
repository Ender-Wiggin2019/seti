import { Button } from '@/components/ui/button';
import type {
  IInputResponse,
  ISelectSectorInputModel,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

export interface ISelectSectorInputProps {
  model: ISelectSectorInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectSectorInput({
  model,
  onSubmit,
}: ISelectSectorInputProps): React.JSX.Element {
  return (
    <div className='grid gap-2 sm:grid-cols-2'>
      {model.options.map((sector) => (
        <Button
          key={sector}
          type='button'
          variant='ghost'
          className='justify-start border border-surface-700/60 bg-surface-800/60 text-text-100 hover:bg-surface-700/70'
          onClick={() =>
            onSubmit({
              type: EPlayerInputType.SECTOR,
              sector,
            })
          }
        >
          {sector}
        </Button>
      ))}
    </div>
  );
}
