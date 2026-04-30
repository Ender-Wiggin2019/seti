import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
  return (
    <div className='space-y-2'>
      <p className='micro-label'>
        {t('client.input.select_planet', { defaultValue: 'Select planet' })}
      </p>
      <div className='grid gap-1.5 sm:grid-cols-2'>
        {model.options.map((planet) => (
          <Button
            key={planet}
            variant='ghost'
            size='sm'
            className='h-9 justify-start gap-2 px-2.5 text-xs'
            onClick={() =>
              onSubmit({
                type: EPlayerInputType.PLANET,
                planet,
              })
            }
          >
            <span
              aria-hidden
              className='h-2 w-2 rounded-full bg-accent-500/70 shadow-[0_0_4px_oklch(0.68_0.11_240/0.6)]'
            />
            <span className='flex-1 truncate font-body text-text-100'>
              {planet}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
