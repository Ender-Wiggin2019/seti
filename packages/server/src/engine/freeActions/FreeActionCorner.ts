import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IFreeActionCornerResult {
  discardedCardId: string;
}

/**
 * Discard a hand card to execute its free-action corner effect.
 *
 * TODO: The actual corner effect execution requires the card system (Card class
 * with freeActionCorner data). For now, this only validates and discards the card.
 */
export class FreeActionCornerFreeAction {
  static canExecute(player: IPlayer, _game: IGame): boolean {
    return player.hand.length > 0;
  }

  static execute(
    player: IPlayer,
    game: IGame,
    cardId: string,
  ): IFreeActionCornerResult {
    if (player.hand.length === 0) {
      throw new GameError(EErrorCode.INVALID_ACTION, 'No cards in hand');
    }

    const cardIndex = player.hand.findIndex(
      (card) =>
        (typeof card === 'string' ? card : (card as { id?: string })?.id) ===
        cardId,
    );
    if (cardIndex < 0) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Card ${cardId} not found in hand`,
        { cardId },
      );
    }

    const [removed] = player.hand.splice(cardIndex, 1);
    const removedId =
      typeof removed === 'string'
        ? removed
        : ((removed as { id?: string })?.id ?? cardId);
    game.mainDeck.discard(removedId);

    // TODO: execute the card's free-action corner effect
    // when the card system provides `card.freeActionCorner.execute(player, game)`

    return { discardedCardId: removedId };
  }
}
