import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { IInputResponse, ISelectTechInputModel } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

export interface ISelectTechInputProps {
  model: ISelectTechInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectTechInput({
  model,
  onSubmit,
}: ISelectTechInputProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <div className='space-y-2'>
      <p className='micro-label'>
        {t('client.input.select_tech', { defaultValue: 'Select tech' })}
      </p>
      <div className='grid gap-1.5 sm:grid-cols-2'>
        {model.options.map((tech) => (
          <Button
            key={tech}
            variant='ghost'
            size='sm'
            className='h-9 justify-start gap-2 px-2.5 font-mono text-[12px] uppercase tracking-[0.08em]'
            onClick={() =>
              onSubmit({
                type: EPlayerInputType.TECH,
                tech,
              })
            }
          >
            <span
              aria-hidden
              className='inline-flex h-4 w-4 items-center justify-center rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-background-900 font-mono text-[9px] text-accent-400'
            >
              ⟟
            </span>
            <span className='flex-1 truncate text-text-100'>{tech}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
