import { EResource } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { hasCardData, loadCardData } from '../cards/loadCardData.js';
import type { IGame } from '../IGame.js';
import { EMissionEventType } from '../missions/IMission.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IFreeActionCornerResult {
  discardedCardId: string;
}

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

    const removed = player.removeCardById(cardId);
    if (removed === undefined) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Card ${cardId} not found in hand`,
        { cardId },
      );
    }

    game.mainDeck.discard(cardId);
    this.executeCardCornerRewards(player, game, cardId);

    return { discardedCardId: cardId };
  }

  private static executeCardCornerRewards(
    player: IPlayer,
    game: IGame,
    cardId: string,
  ): void {
    if (!hasCardData(cardId)) {
      return;
    }

    const cardData = loadCardData(cardId);
    for (const cornerReward of cardData.freeAction ?? []) {
      const value = cornerReward.value;
      if (value <= 0) {
        continue;
      }
      game.missionTracker.recordEvent({
        type: EMissionEventType.CARD_CORNER_USED,
        resourceType: cornerReward.type,
      });

      switch (cornerReward.type) {
        case EResource.CREDIT:
          player.resources.gain({ credits: value });
          break;
        case EResource.ENERGY:
          player.resources.gain({ energy: value });
          break;
        case EResource.DATA:
          player.resources.gain({ data: value });
          break;
        case EResource.PUBLICITY:
          player.resources.gain({ publicity: value });
          break;
        case EResource.SCORE:
          player.score += value;
          break;
        case EResource.MOVE:
          player.gainMove(value);
          break;
        case EResource.CARD:
        case EResource.CARD_ANY:
          for (let index = 0; index < value; index += 1) {
            const drawnCardId = game.mainDeck.draw();
            if (drawnCardId === undefined) {
              break;
            }
            player.hand.push(drawnCardId);
          }
          break;
        default:
          break;
      }
    }
  }
}
