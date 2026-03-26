import type { IBaseCard } from '@seti/common/types/BaseCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardRender } from './CardRender';

interface ICardDetailProps {
  card: IBaseCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardDetail({
  card,
  open,
  onOpenChange,
}: ICardDetailProps): React.JSX.Element | null {
  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl bg-surface-900/95'>
        <DialogHeader>
          <DialogTitle>{card.name}</DialogTitle>
        </DialogHeader>

        <div className='max-h-[70vh] overflow-auto rounded border border-surface-700/50 bg-surface-950/70 p-2'>
          <CardRender card={card} />
        </div>

        <DialogFooter>
          <Button variant='ghost' size='sm' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
