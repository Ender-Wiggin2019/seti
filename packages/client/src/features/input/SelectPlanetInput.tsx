import { Button } from '@/components/ui/button';
import type {
  IInputResponse,
  ISelectPlanetInputModel,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

export interface ISelectPlanetInputProps {
  model: ISelectPlanetInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectPlanetInput({
  model,
  onSubmit,
}: ISelectPlanetInputProps): React.JSX.Element {
  return (
    <div className='grid gap-2 sm:grid-cols-2'>
      {model.options.map((planet) => (
        <Button
          key={planet}
          type='button'
          variant='ghost'
          className='justify-start border border-surface-700/60 bg-surface-800/60 text-text-100 hover:bg-surface-700/70'
          onClick={() =>
            onSubmit({
              type: EPlayerInputType.PLANET,
              planet,
            })
          }
        >
          {planet}
        </Button>
      ))}
    </div>
  );
}
