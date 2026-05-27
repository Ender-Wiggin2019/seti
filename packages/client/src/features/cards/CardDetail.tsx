import { CardRenderContextProvider } from '@seti/cards';
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
  /** Optional per-card branch claim flags so the enlarged preview also shows claim tokens. */
  branchClaimsByCardId?: Record<string, boolean[]>;
  /** Owner color for the claim tokens. */
  ownerPlayerColor?: string;
}

export function CardDetail({
  card,
  open,
  onOpenChange,
  canPlayCard = false,
  onPlayCard,
  branchClaimsByCardId,
  ownerPlayerColor,
}: ICardDetailProps): React.JSX.Element | null {
  const { t } = useTranslation('common');
  const textMode = useTextMode();
  if (!card) return null;

  const renderInner = (
    <div className='max-h-[78vh] overflow-auto rounded border border-surface-700/50 bg-surface-950/70 p-3'>
      {textMode ? (
        <CardRender card={card} />
      ) : (
        // CardRender's intrinsic size is 150 × 209 (the hand
        // thumbnail). Reserve the *scaled* footprint here so the
        // dialog hugs the visible card instead of leaving empty
        // space on either side.
        <div className='relative h-[376px] w-[270px] sm:h-[418px] sm:w-[300px]'>
          <div className='absolute left-0 top-0 origin-top-left scale-[1.8] sm:scale-[2]'>
            <CardRender card={card} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-fit max-w-fit bg-surface-900/95'>
        <DialogHeader>
          <DialogTitle>{card.name}</DialogTitle>
        </DialogHeader>

        {branchClaimsByCardId || ownerPlayerColor ? (
          <CardRenderContextProvider
            value={{ branchClaimsByCardId, ownerPlayerColor }}
          >
            {renderInner}
          </CardRenderContextProvider>
        ) : (
          renderInner
        )}

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
