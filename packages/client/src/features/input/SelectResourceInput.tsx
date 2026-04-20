import { useTranslation } from 'react-i18next';
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

const RESOURCE_ICON: Record<string, string> = {
  credit: '/assets/seti/icons/money.png',
  energy: '/assets/seti/icons/energy.png',
  publicity: '/assets/seti/icons/pop.png',
  data: '/assets/seti/icons/data.png',
  card: '/assets/seti/icons/progress.png',
  vp: '/assets/seti/icons/vp.png',
};

export function SelectResourceInput({
  model,
  onSubmit,
}: ISelectResourceInputProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <div className='space-y-2'>
      <p className='micro-label'>
        {t('client.input.select_resource', { defaultValue: 'Select resource' })}
      </p>
      <div className='grid gap-1.5 sm:grid-cols-2'>
        {model.options.map((resource) => {
          const key = String(resource).toLowerCase();
          const icon = RESOURCE_ICON[key];
          return (
            <Button
              key={resource}
              variant='ghost'
              size='sm'
              className='h-9 justify-start gap-2 px-2.5 font-mono text-[11px] uppercase tracking-[0.1em]'
              onClick={() =>
                onSubmit({
                  type: EPlayerInputType.RESOURCE,
                  resource,
                })
              }
            >
              {icon ? (
                <img src={icon} alt='' aria-hidden className='h-4 w-4' />
              ) : (
                <span
                  aria-hidden
                  className='h-1.5 w-1.5 rounded-full bg-accent-500/70'
                />
              )}
              <span className='flex-1 truncate text-text-100'>{resource}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
