import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useEffect, useMemo, useState } from 'react';
import { CardRender } from '@/features/cards/CardRender';
import type {
  IPlayerInputModel,
  ISelectCardInputModel,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

interface IHandViewProps {
  cards?: IBaseCard[];
  handSize: number;
  pendingInput: IPlayerInputModel | null;
  onSubmitSelection?: (cardIds: string[]) => void;
}

export function HandView({
  cards,
  handSize,
  pendingInput,
  onSubmitSelection,
}: IHandViewProps): React.JSX.Element {
  const selectCardInput = useMemo<ISelectCardInputModel | null>(() => {
    if (pendingInput?.type !== EPlayerInputType.CARD) {
      return null;
    }
    return pendingInput as ISelectCardInputModel;
  }, [pendingInput]);

  const handCards = cards?.length ? cards : (selectCardInput?.cards ?? []);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedCardIds([]);
  }, [selectCardInput?.inputId]);

  function toggleCard(cardId: string): void {
    if (!selectCardInput) {
      return;
    }

    setSelectedCardIds((previous) => {
      if (previous.includes(cardId)) {
        return previous.filter((id) => id !== cardId);
      }
      if (previous.length >= selectCardInput.maxSelections) {
        return previous;
      }
      return [...previous, cardId];
    });
  }

  return (
    <section
      className='h-full rounded border border-surface-700/45 bg-surface-900/65 p-2'
      data-testid='hand-view'
    >
      <div className='mb-1.5 flex items-center justify-between'>
        <p className='font-mono text-[10px] uppercase tracking-wide text-text-500'>
          Hand
        </p>
        <p className='font-mono text-[10px] text-text-400'>{handSize} cards</p>
      </div>

      {handCards.length === 0 ? (
        <div className='rounded border border-dashed border-surface-700/60 bg-surface-950/40 px-2 py-4 text-center text-xs text-text-500'>
          No revealed cards
        </div>
      ) : (
        <div className='grid max-h-[150px] grid-cols-2 gap-1 overflow-auto lg:grid-cols-3'>
          {handCards.map((card) => {
            const isSelected = selectedCardIds.includes(card.id);
            return (
              <button
                key={card.id}
                type='button'
                data-testid={`hand-card-${card.id}`}
                className={[
                  'origin-center rounded border border-surface-700/60 bg-surface-900/70 p-1 transition-transform hover:-translate-y-0.5',
                  selectCardInput ? 'cursor-pointer' : 'cursor-default',
                  isSelected
                    ? 'border-accent-500 ring-1 ring-accent-500/80'
                    : '',
                ].join(' ')}
                onClick={() => toggleCard(card.id)}
              >
                <div className='origin-top-left scale-[0.46]'>
                  <CardRender card={card} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectCardInput ? (
        <div className='mt-2 flex items-center justify-between gap-2'>
          <p className='text-[10px] text-text-400'>
            Pick {selectCardInput.minSelections}-{selectCardInput.maxSelections}
          </p>
          <button
            type='button'
            className='rounded border border-accent-500/70 bg-accent-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent-300 disabled:cursor-not-allowed disabled:opacity-40'
            disabled={selectedCardIds.length < selectCardInput.minSelections}
            onClick={() => onSubmitSelection?.(selectedCardIds)}
          >
            Confirm
          </button>
        </div>
      ) : null}
    </section>
  );
}
