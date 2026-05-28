import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CardRowView } from '@/features/cards/CardRowView';
import { EndOfRoundStacks } from '@/features/cards/EndOfRoundStacks';
import { useGameContext } from '@/pages/game/GameContext';
import { EFreeAction, EPlayerInputType } from '@/types/re-exports';
import { useGameSession } from '../GameSessionContext';
import type { ISectionRenderProps } from '../sectionRegistry';

export function CardRowsSection(_: ISectionRenderProps): React.JSX.Element {
  void _;
  const { t } = useTranslation('common');
  const { gameState, pendingInput, sendFreeAction, sendInput } =
    useGameContext();
  const { armedCardRowBuy, setArmedCardRowBuy, inspectCard } = useGameSession();
  if (!gameState) return <></>;

  const cardSelectionInput =
    pendingInput?.type === EPlayerInputType.CARD ? pendingInput : null;
  const selectableCardIds = new Set(
    cardSelectionInput?.cards.map((c) => c.id) ?? [],
  );
  const isSelectingFromCardRow =
    cardSelectionInput !== null &&
    gameState.cardRow.some((card) => selectableCardIds.has(card.id));

  const handleCardClick = (card: IBaseCard): void => {
    if (isSelectingFromCardRow && cardSelectionInput) {
      sendInput({
        inputId: cardSelectionInput.inputId,
        type: EPlayerInputType.CARD,
        cardIds: [card.id],
      });
      return;
    }
    if (armedCardRowBuy) {
      sendFreeAction({ type: EFreeAction.BUY_CARD, cardId: card.id });
      setArmedCardRowBuy(false);
      return;
    }
    inspectCard(card);
  };

  return (
    <div className='space-y-3'>
      <div className='instrument-panel flex flex-wrap items-center gap-2 p-2'>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 gap-1.5 px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] hover:border-accent-500/70 hover:text-text-100'
          onClick={() =>
            sendFreeAction({
              type: EFreeAction.BUY_CARD,
              fromDeck: true,
            })
          }
        >
          <span
            aria-hidden
            className='h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_4px_oklch(0.68_0.11_240/0.7)]'
          />
          {t('client.game_layout.buy_from_deck')}
        </Button>
        <Button
          variant={armedCardRowBuy ? 'primary' : 'ghost'}
          size='sm'
          className='h-8 px-2.5 font-mono text-[10px] uppercase tracking-[0.14em]'
          onClick={() => setArmedCardRowBuy((v) => !v)}
        >
          {armedCardRowBuy
            ? t('client.game_layout.cancel_row_buy')
            : t('client.game_layout.buy_from_row')}
        </Button>
      </div>

      <CardRowView
        cards={gameState.cardRow}
        mode={
          isSelectingFromCardRow ? 'discard' : armedCardRowBuy ? 'buy' : 'idle'
        }
        onCardClick={handleCardClick}
        onCardInspect={inspectCard}
      />
      <EndOfRoundStacks
        stacks={
          gameState.endOfRoundStacks ??
          gameState.endOfRoundStackCounts?.map(() => []) ?? [[], [], [], []]
        }
        stackCounts={gameState.endOfRoundStackCounts}
        currentRoundIndex={gameState.currentEndOfRoundStackIndex ?? 0}
        mode={
          pendingInput?.type === EPlayerInputType.END_OF_ROUND
            ? 'select'
            : 'idle'
        }
        onSelectCard={(card) => {
          if (pendingInput?.type !== EPlayerInputType.END_OF_ROUND) {
            inspectCard(card);
            return;
          }
          sendInput({
            inputId: pendingInput.inputId,
            type: EPlayerInputType.END_OF_ROUND,
            cardId: card.id,
          });
        }}
      />
    </div>
  );
}
