import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { IInputResponse, ISelectCardInputModel } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

export interface ISelectCardInputProps {
  model: ISelectCardInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectCardInput({
  model,
  onSubmit,
}: ISelectCardInputProps): React.JSX.Element {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedCardIds([]);
  }, [model.inputId]);

  const canSubmit = useMemo(() => {
    return (
      selectedCardIds.length >= model.minSelections &&
      selectedCardIds.length <= model.maxSelections
    );
  }, [model.maxSelections, model.minSelections, selectedCardIds.length]);

  function toggleCard(cardId: string): void {
    setSelectedCardIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= model.maxSelections) {
        return prev;
      }
      return [...prev, cardId];
    });
  }

  return (
    <div className='space-y-2'>
      <p className='text-xs text-text-300'>
        Select {model.minSelections}-{model.maxSelections} card(s)
      </p>
      <div className='grid max-h-48 gap-2 overflow-auto sm:grid-cols-2'>
        {model.cards.map((card) => {
          const isSelected = selectedCardIds.includes(card.id);
          return (
            <button
              key={card.id}
              type='button'
              data-testid={`select-card-${card.id}`}
              className={cn(
                'rounded border px-2 py-1.5 text-left text-xs transition-colors',
                isSelected
                  ? 'border-accent-500 bg-accent-500/15 text-accent-300'
                  : 'border-surface-700/60 bg-surface-800/60 text-text-200 hover:border-accent-400/60',
              )}
              onClick={() => toggleCard(card.id)}
            >
              <p className='font-medium'>{card.name}</p>
              <p className='font-mono text-[10px] text-text-500'>{card.id}</p>
            </button>
          );
        })}
      </div>
      <Button
        type='button'
        disabled={!canSubmit}
        onClick={() =>
          onSubmit({
            type: EPlayerInputType.CARD,
            cardIds: selectedCardIds,
          })
        }
      >
        Confirm Selection
      </Button>
    </div>
  );
}
