import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IPlayCardResult {
  cardId: string;
}

/**
 * Placeholder PlayCard action.
 * Full card effect system is implemented in Stage 3.
 * For now, this validates hand has cards and removes the selected card.
 */
export class PlayCardAction {
  public static canExecute(player: IPlayer, _game: IGame): boolean {
    return player.hand.length > 0;
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    cardIndex: number,
  ): IPlayCardResult {
    if (!this.canExecute(player, game)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'PlayCard action is not currently legal',
        { playerId: player.id },
      );
    }

    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      throw new GameError(EErrorCode.INVALID_ACTION, 'Invalid card index', {
        playerId: player.id,
        cardIndex,
        handSize: player.hand.length,
      });
    }

    const card = player.hand.splice(cardIndex, 1)[0];
    const cardId =
      typeof card === 'string'
        ? card
        : ((card as { id?: string })?.id ?? 'unknown');

    game.mainDeck.discard(cardId);

    return { cardId };
  }
}
