import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTextMode } from '@/stores/debugStore';
import { CardRender } from './CardRender';

interface ICardDetailProps {
  card: IBaseCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canPlayCard?: boolean;
  onPlayCard?: () => void;
}

export function CardDetail({
  card,
  open,
  onOpenChange,
  canPlayCard = false,
  onPlayCard,
}: ICardDetailProps): React.JSX.Element | null {
  const { t } = useTranslation('common');
  const textMode = useTextMode();
  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl bg-surface-900/95'>
        <DialogHeader>
          <DialogTitle>{card.name}</DialogTitle>
        </DialogHeader>

        <div className='max-h-[78vh] overflow-auto rounded border border-surface-700/50 bg-surface-950/70 p-3'>
          {textMode ? (
            <CardRender card={card} />
          ) : (
            <div className='mx-auto w-fit'>
              <div className='relative h-[335px] w-[240px] sm:h-[376px] sm:w-[270px]'>
                <div className='absolute left-0 top-0 origin-top-left scale-[1.6] sm:scale-[1.8]'>
                  <CardRender card={card} />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {canPlayCard && onPlayCard ? (
            <Button
              variant='primary'
              size='lg'
              className='h-12 min-w-[180px] font-mono text-[12px] uppercase tracking-[0.16em]'
              data-testid='card-detail-play-card'
              onClick={onPlayCard}
            >
              {t('client.action_menu.actions.PLAY_CARD', {
                defaultValue: 'Play Card',
              })}
            </Button>
          ) : null}
          <Button variant='ghost' size='sm' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
