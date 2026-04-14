import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { CardRender } from './CardRender';

export type TEndOfRoundMode = 'idle' | 'select';

interface IEndOfRoundStacksProps {
  stacks: IBaseCard[][];
  currentRoundIndex: number;
  mode?: TEndOfRoundMode;
  onSelectCard?: (card: IBaseCard) => void;
}

export function EndOfRoundStacks({
  stacks,
  currentRoundIndex,
  mode = 'idle',
  onSelectCard,
}: IEndOfRoundStacksProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const currentStack = stacks[currentRoundIndex] ?? [];

  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          {t('client.end_of_round.title')}
        </h2>
      </header>

      <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => {
          const stackCards = stacks[index] ?? [];
          const isCurrent = index === currentRoundIndex;
          return (
            <div
              key={`round-stack-${index}`}
              data-testid={`round-stack-${index}`}
              className={cn(
                'rounded-md border border-surface-700/50 bg-surface-900/70 p-2',
                isCurrent && 'border-accent-500 ring-1 ring-accent-500/70',
              )}
            >
              <p className='font-mono text-[10px] uppercase tracking-wider text-text-500'>
                {t('client.end_of_round.round', { index: index + 1 })}
              </p>
              <div className='mt-1 h-16 rounded border border-surface-700/50 bg-[url(/assets/seti/cards/back_base.jpg)] bg-cover bg-center' />
              <p className='mt-1 font-mono text-[10px] text-text-300'>
                {t('client.end_of_round.cards', { count: stackCards.length })}
              </p>
            </div>
          );
        })}
      </div>

      {mode === 'select' && (
        <div className='mt-3 rounded-md border border-accent-500/40 bg-accent-500/10 p-2'>
          <p className='mb-2 font-mono text-[10px] uppercase tracking-wider text-accent-300'>
            {t('client.end_of_round.select_one')}
          </p>
          <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
            {currentStack.map((card) => (
              <button
                key={card.id}
                type='button'
                data-testid={`round-stack-card-${card.id}`}
                onClick={() => onSelectCard?.(card)}
                className='overflow-hidden rounded border border-surface-700/50 bg-surface-900/70 p-2 text-left transition-colors hover:border-accent-500'
              >
                <div className='pointer-events-none origin-top-left scale-[0.52]'>
                  <CardRender card={card} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
