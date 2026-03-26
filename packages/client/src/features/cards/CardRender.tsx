import type { IBaseCard } from '@seti/common/types/BaseCard';

interface ICardRenderProps {
  card: IBaseCard;
}

export function CardRender({ card }: ICardRenderProps): React.JSX.Element {
  return (
    <article
      data-testid={`card-render-${card.id}`}
      className='w-[170px] rounded border border-surface-700/60 bg-surface-950/80 p-2 text-left'
    >
      <header className='border-b border-surface-700/50 pb-1'>
        <h4 className='line-clamp-2 font-display text-xs font-semibold uppercase tracking-wide text-text-100'>
          {card.name}
        </h4>
      </header>
      <div className='mt-2 space-y-1 font-mono text-[10px] text-text-300'>
        <p>Cost: {card.price}</p>
        <p>Income: {card.income}</p>
        <p>Effects: {card.effects.length}</p>
      </div>
    </article>
  );
}
