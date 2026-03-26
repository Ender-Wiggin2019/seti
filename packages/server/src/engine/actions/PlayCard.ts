import { EResource } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { getCardRegistry } from '../cards/CardRegistry.js';
import { EServerCardKind } from '../cards/ICard.js';
import { hasCardData } from '../cards/loadCardData.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IPlayCardResult {
  cardId: string;
  destination: 'discard' | 'mission' | 'endGame';
  price: number;
  priceType: string;
}

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

    const card = player.hand[cardIndex];
    const cardId =
      typeof card === 'string'
        ? card
        : ((card as { id?: string })?.id ?? 'unknown');

    // Backward compatibility for placeholder test cards like `card-1`.
    if (!hasCardData(cardId)) {
      player.hand.splice(cardIndex, 1);
      game.mainDeck.discard(cardId);
      return {
        cardId,
        destination: 'discard',
        price: 0,
        priceType: EResource.CREDIT,
      };
    }

    const runtimeCard = getCardRegistry().create(cardId);
    if (!runtimeCard.canPlay({ player, game })) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Card cannot be played now',
        {
          cardId,
          playerId: player.id,
        },
      );
    }

    const price = runtimeCard.price;
    const priceType = runtimeCard.priceType ?? EResource.CREDIT;

    player.resources.spend(this.getPriceResourceBundle(runtimeCard));
    player.hand.splice(cardIndex, 1);
    runtimeCard.play({ player, game });

    if (runtimeCard.kind === EServerCardKind.MISSION) {
      player.playedMissions.push(runtimeCard);
      return { cardId, destination: 'mission', price, priceType };
    }
    if (runtimeCard.kind === EServerCardKind.END_GAME) {
      player.endGameCards.push(runtimeCard);
      return { cardId, destination: 'endGame', price, priceType };
    }

    game.mainDeck.discard(cardId);
    return { cardId, destination: 'discard', price, priceType };
  }

  private static getPriceResourceBundle(card: {
    price: number;
    priceType?: EResource;
  }): {
    credits?: number;
    energy?: number;
    publicity?: number;
    data?: number;
  } {
    const priceType = card.priceType ?? EResource.CREDIT;
    if (priceType === EResource.ENERGY) {
      return { energy: card.price };
    }
    if (priceType === EResource.PUBLICITY) {
      return { publicity: card.price };
    }
    if (priceType === EResource.DATA) {
      return { data: card.price };
    }
    return { credits: card.price };
  }
}
