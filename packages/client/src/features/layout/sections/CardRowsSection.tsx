import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardRender } from '@/features/cards/CardRender';
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
  const [buyConfirm, setBuyConfirm] = useState<
    { kind: 'deck' } | { kind: 'row'; card: IBaseCard } | null
  >(null);
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
      setBuyConfirm({ kind: 'row', card });
      return;
    }
    inspectCard(card);
  };

  return (
    <div className='space-y-3'>
      <div
        className='instrument-panel flex flex-wrap items-center gap-2 p-2'
        data-testid='cards-tab-buy-chooser'
      >
        <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-accent-300'>
          {t('client.game_layout.buy_card_title', {
            defaultValue: 'Buy Card',
          })}
        </span>
        <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-text-400'>
          {t('client.game_layout.buy_card_cost', {
            defaultValue: '3 publicity',
          })}
        </span>
        <Button
          variant='primary'
          size='sm'
          className='ml-auto h-8 px-3 font-mono text-[10px] uppercase tracking-[0.14em]'
          data-testid='cards-tab-buy-from-deck'
          onClick={() => {
            setArmedCardRowBuy(false);
            setBuyConfirm({ kind: 'deck' });
          }}
        >
          {t('client.game_layout.buy_from_deck')}
        </Button>
        <Button
          variant={armedCardRowBuy ? 'primary' : 'ghost'}
          size='sm'
          className='h-8 px-3 font-mono text-[10px] uppercase tracking-[0.14em]'
          data-testid='cards-tab-buy-from-row'
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
      <Dialog
        open={buyConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setBuyConfirm(null);
        }}
      >
        <DialogContent className='w-fit max-w-fit'>
          <DialogHeader>
            <DialogTitle>
              {buyConfirm?.kind === 'deck'
                ? t('client.game_layout.buy_from_deck')
                : t('client.game_layout.buy_from_row')}
            </DialogTitle>
          </DialogHeader>
          <div className='max-h-[78vh] overflow-auto rounded border border-surface-700/50 bg-surface-950/70 p-3'>
            <div className='relative h-[376px] w-[270px] sm:h-[418px] sm:w-[300px]'>
              {buyConfirm?.kind === 'row' ? (
                <div className='absolute left-0 top-0 origin-top-left scale-[1.8] sm:scale-[2]'>
                  <CardRender card={buyConfirm.card} />
                </div>
              ) : (
                <div
                  className='absolute inset-0 rounded border border-surface-700/50 bg-[url(/assets/seti/cards/back_base.jpg)] bg-cover bg-center'
                  aria-hidden
                />
              )}
            </div>
          </div>
          <div className='instrument-panel p-3'>
            <div className='section-head mb-2'>
              <span aria-hidden className='section-head__tick' />
              <p className='micro-label'>{t('client.action_confirm.cost')}</p>
              <div aria-hidden className='section-head__rule' />
            </div>
            <p className='readout font-mono text-[13px] text-text-100'>
              {t('client.game_layout.buy_card_cost', {
                defaultValue: '3 publicity',
              })}
            </p>
          </div>
          <DialogFooter>
            <Button variant='ghost' onClick={() => setBuyConfirm(null)}>
              {t('client.common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              variant='primary'
              onClick={() => {
                if (buyConfirm?.kind === 'deck') {
                  sendFreeAction({
                    type: EFreeAction.BUY_CARD,
                    fromDeck: true,
                  });
                } else if (buyConfirm?.kind === 'row') {
                  sendFreeAction({
                    type: EFreeAction.BUY_CARD,
                    cardId: buyConfirm.card.id,
                  });
                  setArmedCardRowBuy(false);
                }
                setBuyConfirm(null);
              }}
            >
              {t('client.common.confirm', { defaultValue: 'Confirm' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
