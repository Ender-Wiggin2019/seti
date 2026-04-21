import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CardRender } from '@/features/cards/CardRender';
import { cn } from '@/lib/cn';
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
  cornerSelectionMode?: boolean;
  onCardCornerSelect?: (cardId: string) => void;
  playCardSelectionMode?: boolean;
  onCardPlaySelect?: (cardId: string) => void;
  onCardInspect?: (card: IBaseCard) => void;
  /**
   * `panel` (default) — renders the hand as a bounded instrument panel
   * with its own header (used when embedded inside a column).
   * `dock` — renders the hand as a borderless grid optimised for a full-
   * width bottom dock. The dock provides its own header, so HandView only
   * renders the cards and selection footer. The grid stretches to fill
   * available horizontal space with tighter gaps.
   */
  variant?: 'panel' | 'dock';
}

export function HandView({
  cards,
  handSize,
  pendingInput,
  onSubmitSelection,
  cornerSelectionMode = false,
  onCardCornerSelect,
  playCardSelectionMode = false,
  onCardPlaySelect,
  onCardInspect,
  variant = 'panel',
}: IHandViewProps): React.JSX.Element {
  const { t } = useTranslation('common');
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
    if (!selectCardInput) return;
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

  function handleCardClick(card: IBaseCard): void {
    if (selectCardInput) {
      toggleCard(card.id);
      return;
    }
    if (cornerSelectionMode) {
      onCardCornerSelect?.(card.id);
      return;
    }
    if (playCardSelectionMode) {
      onCardPlaySelect?.(card.id);
      return;
    }
    onCardInspect?.(card);
  }

  const modeLabel = selectCardInput
    ? t('client.hand_view.mode_select', { defaultValue: 'SELECT' })
    : cornerSelectionMode
      ? t('client.hand_view.mode_corner', { defaultValue: 'CORNER' })
      : playCardSelectionMode
        ? t('client.hand_view.mode_play', { defaultValue: 'PLAY' })
        : null;

  const isDock = variant === 'dock';

  const cardGrid =
    handCards.length === 0 ? (
      <div
        className={cn(
          'flex items-center justify-center rounded-[4px] border border-dashed border-[color:var(--metal-edge-soft)] bg-background-950/50 px-2',
          isDock ? 'py-3' : 'py-5',
        )}
      >
        <p className='font-mono text-[10px] uppercase tracking-[0.14em] text-text-500'>
          {t('client.hand_view.empty', { defaultValue: 'No revealed cards' })}
        </p>
      </div>
    ) : (
      <div
        className={cn(
          'grid overflow-auto',
          isDock
            ? 'grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-1'
            : 'max-h-[150px] grid-cols-2 gap-1.5 lg:grid-cols-3',
        )}
      >
        {handCards.map((card) => {
          const isSelected = selectedCardIds.includes(card.id);
          return (
            <button
              key={card.id}
              type='button'
              data-testid={`hand-card-${card.id}`}
              className={cn(
                'relative rounded-[4px] border p-1 transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5',
                'focus-visible:outline-none focus-visible:shadow-focus-ring',
                selectCardInput || cornerSelectionMode || playCardSelectionMode
                  ? 'cursor-pointer'
                  : 'cursor-default',
                cornerSelectionMode
                  ? 'border-accent-500/70 bg-accent-500/[0.08] shadow-[inset_0_0_0_1px_oklch(0.68_0.11_240/0.25)]'
                  : isSelected
                    ? 'border-accent-500 bg-accent-500/[0.08] shadow-[0_0_0_1px_oklch(0.68_0.11_240/0.4)]'
                    : 'border-[color:var(--metal-edge-soft)] bg-background-900/75 shadow-hairline-inset hover:border-[oklch(0.40_0.04_240)]',
              )}
              onClick={() => handleCardClick(card)}
            >
              <div
                className={cn(
                  'pointer-events-none',
                  isDock && 'origin-top-left scale-[0.52]',
                )}
              >
                <CardRender card={card} />
              </div>
            </button>
          );
        })}
      </div>
    );

  const selectionFooter = selectCardInput ? (
    <div className='mt-2 flex items-center justify-between gap-2'>
      <p className='font-mono text-[10px] tracking-[0.08em] text-text-500'>
        {t('client.hand_view.pick_range', {
          min: selectCardInput.minSelections,
          max: selectCardInput.maxSelections,
          defaultValue: `Pick ${selectCardInput.minSelections}–${selectCardInput.maxSelections}`,
        })}
        <span className='ml-2 text-text-300'>
          {selectedCardIds.length}/{selectCardInput.maxSelections}
        </span>
      </p>
      <Button
        variant={
          selectedCardIds.length >= selectCardInput.minSelections
            ? 'primary'
            : 'ghost'
        }
        size='sm'
        className='h-7 px-2.5 font-mono text-[10px] uppercase tracking-[0.14em]'
        disabled={selectedCardIds.length < selectCardInput.minSelections}
        onClick={() => onSubmitSelection?.(selectedCardIds)}
      >
        {t('client.common.confirm')}
      </Button>
    </div>
  ) : null;

  if (isDock) {
    // Dock variant: header is provided by HandDock; we render only the card
    // grid and the optional selection footer so the dock can own its own
    // chrome (toggle, count, mode tags).
    return (
      <div className='flex flex-col gap-2' data-testid='hand-view'>
        {cardGrid}
        {selectionFooter}
      </div>
    );
  }

  return (
    <section className='instrument-panel h-full p-2' data-testid='hand-view'>
      <div className='section-head mb-1.5'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.hand_view.title', { defaultValue: 'Hand' })}
        </p>
        <div aria-hidden className='section-head__rule' />
        {modeLabel ? (
          <span className='font-mono text-[9px] uppercase tracking-[0.14em] text-accent-400'>
            {modeLabel}
          </span>
        ) : null}
        <span className='font-mono text-[10px] text-text-500 tabular-nums'>
          {t('client.hand_view.count', {
            count: handSize,
            defaultValue: `${handSize} cards`,
          })}
        </span>
      </div>

      {cardGrid}
      {selectionFooter}
    </section>
  );
}
