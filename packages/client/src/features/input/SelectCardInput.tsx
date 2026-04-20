import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
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
      <div className='flex items-center justify-between gap-2'>
        <p className='micro-label'>
          {t('client.input.select_cards', {
            min: model.minSelections,
            max: model.maxSelections,
            defaultValue: `Select ${model.minSelections}–${model.maxSelections} cards`,
          })}
        </p>
        <span className='font-mono text-[11px] tabular-nums text-text-300'>
          {selectedCardIds.length}/{model.maxSelections}
        </span>
      </div>
      <div className='grid max-h-48 gap-1.5 overflow-auto sm:grid-cols-2'>
        {model.cards.map((card) => {
          const isSelected = selectedCardIds.includes(card.id);
          return (
            <button
              key={card.id}
              type='button'
              data-testid={`select-card-${card.id}`}
              aria-pressed={isSelected}
              className={cn(
                'flex flex-col gap-0.5 rounded-[4px] px-2.5 py-1.5 text-left',
                'border transition-[background,border-color,box-shadow] duration-150',
                'focus-visible:outline-none focus-visible:shadow-focus-ring',
                isSelected
                  ? [
                      'border-accent-500/70 bg-accent-500/[0.08]',
                      'shadow-[inset_0_1px_0_oklch(0.78_0.07_240/0.25),inset_0_0_0_1px_oklch(0.68_0.11_240/0.25)]',
                    ]
                  : [
                      'border-[color:var(--metal-edge-soft)] bg-background-900/75',
                      'shadow-hairline-inset',
                      'hover:border-[oklch(0.40_0.04_240)]',
                    ],
              )}
              onClick={() => toggleCard(card.id)}
            >
              <p
                className={cn(
                  'truncate font-body text-[12px] font-medium',
                  isSelected ? 'text-text-100' : 'text-text-200',
                )}
              >
                {card.name}
              </p>
              <p className='truncate font-mono text-[10px] tracking-[0.06em] text-text-500'>
                {card.id}
              </p>
            </button>
          );
        })}
      </div>
      <Button
        disabled={!canSubmit}
        className='w-full'
        onClick={() =>
          onSubmit({
            type: EPlayerInputType.CARD,
            cardIds: selectedCardIds,
          })
        }
      >
        {t('client.input.confirm_selection', {
          defaultValue: 'Confirm Selection',
        })}
      </Button>
    </div>
  );
}
