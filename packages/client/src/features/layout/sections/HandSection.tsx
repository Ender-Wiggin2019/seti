import { canPlaySpecificCard } from '@seti/common/rules';
import { HandDock } from '@/features/player';
import { useGameContext } from '@/pages/game/GameContext';
import { EFreeAction, EMainAction, EPlayerInputType } from '@/types/re-exports';
import { useGameSession } from '../GameSessionContext';
import type { ISectionRenderProps } from '../sectionRegistry';

export function HandSection(_: ISectionRenderProps): React.JSX.Element {
  void _;
  const {
    gameState,
    myPlayerId,
    pendingInput,
    sendFreeAction,
    sendInput,
    sendAction,
  } = useGameContext();
  const {
    handExpanded,
    toggleHand,
    cornerSelectionMode,
    setCornerSelectionMode,
    playCardSelectionMode,
    setPlayCardSelectionMode,
    inspectCard,
  } = useGameSession();
  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);

  return (
    <div data-testid='bottom-hand'>
      <HandDock
        cards={myPlayer?.hand}
        handSize={myPlayer?.handSize ?? 0}
        pendingInput={pendingInput}
        cornerSelectionMode={cornerSelectionMode}
        playCardSelectionMode={playCardSelectionMode}
        expanded={handExpanded}
        onToggle={toggleHand}
        onSubmitSelection={(cardIds) => {
          if (pendingInput?.type !== EPlayerInputType.CARD) return;
          sendInput({
            inputId: pendingInput.inputId,
            type: EPlayerInputType.CARD,
            cardIds,
          });
        }}
        onCardCornerSelect={(cardId) => {
          sendFreeAction({ type: EFreeAction.USE_CARD_CORNER, cardId });
          setCornerSelectionMode(false);
        }}
        onCardPlaySelect={(cardId) => {
          const hand = myPlayer?.hand ?? [];
          const cardIndex = hand.findIndex((card) => card.id === cardId);
          if (cardIndex < 0) {
            setPlayCardSelectionMode(false);
            return;
          }
          const card = hand[cardIndex];
          if (!myPlayer || !canPlaySpecificCard(myPlayer, card)) return;
          sendAction({
            type: EMainAction.PLAY_CARD,
            payload: { cardIndex },
          });
          setPlayCardSelectionMode(false);
        }}
        onCardInspect={inspectCard}
      />
    </div>
  );
}
