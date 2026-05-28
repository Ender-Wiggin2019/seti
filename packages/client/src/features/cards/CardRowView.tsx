import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { CardRender } from './CardRender';

export type TCardRowMode = 'idle' | 'buy' | 'discard';

interface ICardRowViewProps {
  cards: IBaseCard[];
  mode?: TCardRowMode;
  selectedCardId?: string | null;
  onCardClick?: (card: IBaseCard) => void;
  onCardInspect?: (card: IBaseCard) => void;
}

export function CardRowView({
  cards,
  mode = 'idle',
  selectedCardId = null,
  onCardClick,
  onCardInspect,
}: ICardRowViewProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          {t('client.card_row.title')}
        </h2>
      </header>

      <div className='flex flex-wrap gap-2'>
        {cards.map((card) => {
          const isSelected = selectedCardId === card.id;
          return (
            <button
              key={card.id}
              type='button'
              data-testid={`card-row-${card.id}`}
              onClick={() => onCardClick?.(card)}
              onDoubleClick={() => onCardInspect?.(card)}
              className={cn(
                // w-fit hugs the 150px CardRender so each tile only
                // takes the card's natural width — prevents the
                // earlier behavior where each grid cell stretched to
                // a third of the panel and left empty space beside
                // the card.
                'group relative w-fit shrink-0 overflow-hidden rounded-md border border-surface-700/50 bg-surface-900/70 p-2 text-left transition-all',
                mode === 'buy' &&
                  'cursor-pointer hover:border-accent-500 hover:shadow-hud-glow',
                mode === 'discard' &&
                  'cursor-pointer hover:border-error-500/70 hover:bg-error-500/10',
                mode === 'idle' &&
                  (onCardClick ? 'cursor-pointer' : 'cursor-default'),
                isSelected &&
                  'border-error-500 bg-error-500/10 ring-1 ring-error-500/80',
              )}
              aria-label={`card-row-${card.name}`}
            >
              {/*
                Scale CardRender (intrinsic 150×209) to 1.4× — gives
                a more readable card row + end-of-round preview at
                the cost of a larger reserved footprint. The wrapper
                height/width matches the scaled size so flex layout
                doesn't overlap neighbours.
              */}
              <div
                className='pointer-events-none'
                style={{
                  width: '210px',
                  height: '293px',
                  position: 'relative',
                }}
              >
                <div
                  className='absolute left-0 top-0 origin-top-left'
                  style={{ transform: 'scale(1.4)' }}
                >
                  <CardRender card={card} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
