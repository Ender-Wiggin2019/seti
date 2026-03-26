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

export function ActionConfirm({
  open,
  title,
  description,
  costs = [],
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: IActionConfirmProps): React.JSX.Element {
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
          <div className='rounded border border-surface-700/70 bg-surface-900/70 p-3'>
            <p className='font-mono text-xs uppercase tracking-wide text-text-400'>
              Cost
            </p>
            <ul className='mt-2 space-y-1 text-sm text-text-200'>
              {costs.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <DialogFooter>
          <Button type='button' variant='ghost' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='button' onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
