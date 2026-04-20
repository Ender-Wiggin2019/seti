import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

const BUY_CARD_PUBLICITY_COST = 3;

export interface IBuyCardResult {
  cardId: string;
  source: 'row' | 'deck';
  refilled: boolean;
}

export class BuyCardFreeAction {
  static canExecute(player: IPlayer, _game: IGame): boolean {
    return player.resources.publicity >= BUY_CARD_PUBLICITY_COST;
  }

  static execute(
    player: IPlayer,
    game: IGame,
    options: { cardId?: string; fromDeck?: boolean },
  ): IBuyCardResult {
    if (player.resources.publicity < BUY_CARD_PUBLICITY_COST) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'Not enough publicity to buy a card',
        {
          required: BUY_CARD_PUBLICITY_COST,
          available: player.resources.publicity,
        },
      );
    }

    if (options.fromDeck) {
      this.assertDeckPurchaseAvailable(game);
    } else {
      this.assertRowPurchaseAvailable(game, options.cardId);
    }

    player.resources.spend({ publicity: BUY_CARD_PUBLICITY_COST });

    if (options.fromDeck) {
      return this.buyFromDeck(player, game);
    }

    return this.buyFromRow(player, game, options.cardId);
  }

  private static assertDeckPurchaseAvailable(game: IGame): void {
    if (game.mainDeck.totalSize === 0) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No cards available in deck or discard pile',
      );
    }
  }

  private static assertRowPurchaseAvailable(
    game: IGame,
    cardId?: string,
  ): void {
    if (game.cardRow.length === 0) {
      throw new GameError(EErrorCode.INVALID_ACTION, 'Card row is empty');
    }

    if (cardId === undefined) {
      return;
    }

    const cardExists = game.cardRow.some(
      (item) =>
        (typeof item === 'string' ? item : (item as { id?: string })?.id) ===
        cardId,
    );

    if (!cardExists) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Card ${cardId} not found in card row`,
        { cardId },
      );
    }
  }

  private static buyFromDeck(player: IPlayer, game: IGame): IBuyCardResult {
    const card = game.mainDeck.drawWithReshuffle(game.random);
    if (card === undefined) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No cards available in deck or discard pile',
      );
    }
    player.hand.push(card);
    game.lockCurrentTurn();
    return { cardId: card, source: 'deck', refilled: false };
  }

  private static buyFromRow(
    player: IPlayer,
    game: IGame,
    cardId?: string,
  ): IBuyCardResult {
    if (game.cardRow.length === 0) {
      throw new GameError(EErrorCode.INVALID_ACTION, 'Card row is empty');
    }

    let cardIndex: number;
    if (cardId !== undefined) {
      cardIndex = game.cardRow.findIndex(
        (item) =>
          (typeof item === 'string' ? item : (item as { id?: string })?.id) ===
          cardId,
      );
      if (cardIndex < 0) {
        throw new GameError(
          EErrorCode.INVALID_ACTION,
          `Card ${cardId} not found in card row`,
          { cardId },
        );
      }
    } else {
      cardIndex = 0;
    }

    const [removed] = game.cardRow.splice(cardIndex, 1);
    const removedId =
      typeof removed === 'string'
        ? removed
        : ((removed as { id?: string })?.id ?? 'unknown');
    player.hand.push(removed);

    let refilled = false;
    const drawn = game.mainDeck.drawWithReshuffle(game.random);
    if (drawn !== undefined) {
      game.cardRow.push(drawn);
      refilled = true;
      game.lockCurrentTurn();
    }

    return { cardId: removedId, source: 'row', refilled };
  }
}
