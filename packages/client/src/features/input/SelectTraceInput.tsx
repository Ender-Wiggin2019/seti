import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
  return (
    <div className='space-y-2'>
      <p className='micro-label'>
        {t('client.input.select_trace', { defaultValue: 'Select trace' })}
      </p>
      <div className='grid gap-1.5 sm:grid-cols-2'>
        {model.options.map((trace) => (
          <Button
            key={trace}
            variant='ghost'
            size='sm'
            className='h-9 justify-start gap-2 px-2.5 font-mono text-[12px] uppercase tracking-[0.08em]'
            onClick={() =>
              onSubmit({
                type: EPlayerInputType.TRACE,
                trace,
              })
            }
          >
            <span
              aria-hidden
              className='inline-block h-px w-3 bg-accent-500/80'
            />
            <span className='flex-1 truncate text-text-100'>{trace}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
