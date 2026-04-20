import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
  return (
    <div className='space-y-2'>
      <p className='micro-label'>
        {t('client.input.select_sector', { defaultValue: 'Select sector' })}
      </p>
      <div className='grid gap-1.5 sm:grid-cols-3'>
        {model.options.map((sector) => (
          <Button
            key={sector}
            variant='ghost'
            size='sm'
            data-testid={`input-sector-${sector}`}
            className='h-9 justify-start gap-2 px-2.5 font-mono text-[12px] uppercase tracking-[0.08em]'
            onClick={() =>
              onSubmit({
                type: EPlayerInputType.SECTOR,
                sector,
              })
            }
          >
            <span
              aria-hidden
              className='inline-flex h-4 w-4 items-center justify-center rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-background-900 font-mono text-[9px] text-accent-400'
            >
              §
            </span>
            <span className='flex-1 truncate text-text-100'>{sector}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
