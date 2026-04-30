import { EResource } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { getCardRegistry } from '../cards/CardRegistry.js';
import type { ICard } from '../cards/ICard.js';
import { EServerCardKind } from '../cards/ICard.js';
import { hasCardData } from '../cards/loadCardData.js';
import { EPriority } from '../deferred/Priority.js';
import { SimpleDeferredAction } from '../deferred/SimpleDeferredAction.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IPlayCardResult {
  cardId: string;
  destination: 'discard' | 'mission' | 'endGame' | 'income';
  price: number;
  priceType: string;
  card?: ICard;
}

export class PlayCardAction {
  public static canExecute(player: IPlayer, _game: IGame): boolean {
    return player.hand.length > 0;
  }

  public static canExecuteCardAtIndex(
    player: IPlayer,
    game: IGame,
    cardIndex: number,
  ): boolean {
    if (!this.canExecute(player, game)) {
      return false;
    }

    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      return false;
    }

    const cardId = player.getCardIdAt(cardIndex);
    if (!hasCardData(cardId)) {
      return true;
    }

    return getCardRegistry().create(cardId).canPlay({ player, game });
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

    const cardId = player.getCardIdAt(cardIndex);

    if (!hasCardData(cardId)) {
      player.removeCardAt(cardIndex);
      game.mainDeck.discard(cardId);
      return {
        cardId,
        destination: 'discard',
        price: 0,
        priceType: EResource.CREDIT,
      };
    }

    const runtimeCard = getCardRegistry().create(cardId);
    if (!this.canExecuteCardAtIndex(player, game, cardIndex)) {
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
    const playedCard = player.removeCardAt(cardIndex);
    const runtimeContext = { player, game, playedCard };
    runtimeCard.play(runtimeContext);

    if (runtimeCard.kind === EServerCardKind.MISSION) {
      player.playedMissions.push(runtimeCard);
      return {
        cardId,
        destination: 'mission',
        price,
        priceType,
        card: runtimeCard,
      };
    }
    if (runtimeCard.kind === EServerCardKind.END_GAME) {
      player.endGameCards.push(runtimeCard);
      return { cardId, destination: 'endGame', price, priceType };
    }

    if (runtimeCard.movesPlayedCardToIncomeAfterPlay(runtimeContext)) {
      return { cardId, destination: 'income', price, priceType };
    }

    this.discardPlayedCard(game, cardId, runtimeCard.alien);
    this.enqueueReturnToHandHook(player, game, cardId, runtimeCard);
    return { cardId, destination: 'discard', price, priceType };
  }

  private static discardPlayedCard(
    game: IGame,
    cardId: string,
    alienType: ICard['alien'] | undefined,
  ): void {
    if (alienType !== undefined) {
      const board = game.alienState.getBoardByType(alienType as never);
      if (board) {
        board.discardAlienCard(cardId);
        return;
      }
    }

    game.mainDeck.discard(cardId);
  }

  private static enqueueReturnToHandHook(
    player: IPlayer,
    game: IGame,
    cardId: string,
    runtimeCard: ICard,
  ): void {
    game.deferredActions.push(
      new SimpleDeferredAction(
        player,
        (currentGame) => {
          if (
            !runtimeCard.canReturnToHandAfterPlay({
              player,
              game: currentGame,
            })
          ) {
            return undefined;
          }

          if (runtimeCard.alien !== undefined) {
            return undefined;
          }

          const returnedCard = currentGame.mainDeck.removeFromDiscard(cardId);
          if (returnedCard !== undefined) {
            player.hand.push(returnedCard);
          }

          return undefined;
        },
        EPriority.DEFAULT,
      ),
    );
  }

  private static getPriceResourceBundle(card: {
    price: number;
    priceType?: EResource;
  }): {
    credits?: number;
    energy?: number;
    publicity?: number;
    data?: number;
    signalTokens?: number;
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
    if (priceType === EResource.SIGNAL_TOKEN) {
      return { signalTokens: card.price };
    }
    return { credits: card.price };
  }
}
