import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface IActionConfirmProps {
  open: boolean;
  title: string;
  description?: string;
  costs?: string[];
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ActionConfirm — a small mission-log style confirmation for free
 * actions that cost resources. Costs are itemized as mono readouts
 * inside an instrument panel with a leading bullet tick.
 */
export function ActionConfirm({
  open,
  title,
  description,
  costs = [],
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: IActionConfirmProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <p className='text-sm text-text-300'>{description}</p>
          ) : null}
        </DialogHeader>

        {costs.length > 0 ? (
          <div className='instrument-panel p-3'>
            <div className='section-head mb-2'>
              <span aria-hidden className='section-head__tick' />
              <p className='micro-label'>{t('client.action_confirm.cost')}</p>
              <div aria-hidden className='section-head__rule' />
            </div>
            <ul className='space-y-1'>
              {costs.map((item) => (
                <li
                  key={item}
                  className='flex items-start gap-2 font-mono text-[13px] text-text-100'
                >
                  <span
                    aria-hidden
                    className='mt-[7px] inline-block h-px w-2 bg-accent-500/80'
                  />
                  <span className='readout'>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant='ghost' onClick={onCancel}>
            {t('client.common.cancel')}
          </Button>
          <Button onClick={onConfirm}>
            {confirmLabel === 'Confirm'
              ? t('client.common.confirm')
              : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
