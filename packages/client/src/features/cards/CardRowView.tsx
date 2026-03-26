import type { IBaseCard } from '@seti/common/types/BaseCard';
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
  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          Card Row
        </h2>
      </header>

      <div className='grid gap-2 sm:grid-cols-3'>
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
                'group relative overflow-hidden rounded-md border border-surface-700/50 bg-surface-900/70 p-2 text-left transition-all',
                mode === 'buy' &&
                  'cursor-pointer hover:border-accent-500 hover:shadow-hud-glow',
                mode === 'discard' &&
                  'cursor-pointer hover:border-error-500/70 hover:bg-error-500/10',
                mode === 'idle' && 'cursor-default',
                isSelected &&
                  'border-error-500 bg-error-500/10 ring-1 ring-error-500/80',
              )}
              aria-label={`card-row-${card.name}`}
            >
              <div className='pointer-events-none origin-top-left scale-[0.6]'>
                <CardRender card={card} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
