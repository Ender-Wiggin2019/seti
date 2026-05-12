import { isDiscardProhibitedCard } from '@seti/common/rules';
import { EResource } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { hasCardData, loadCardData } from '../cards/loadCardData.js';
import { AnyCardChoiceEffect } from '../effects/card/AnyCardChoiceEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import { EMissionEventType } from '../missions/IMission.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IFreeActionCornerResult {
  discardedCardId: string;
  pendingInput?: IPlayerInput;
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

    const cardIndex = player.findCardInHand(cardId);
    if (cardIndex < 0) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Card ${cardId} not found in hand`,
        { cardId },
      );
    }
    const card = player.hand[cardIndex];
    if (isDiscardProhibitedCard(card)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Card ${cardId} cannot be discarded`,
        { cardId },
      );
    }
    player.removeCardAt(cardIndex);

    game.mainDeck.discard(cardId);
    const pendingInput = this.executeCardCornerRewards(player, game, cardId);

    return { discardedCardId: cardId, pendingInput };
  }

  private static executeCardCornerRewards(
    player: IPlayer,
    game: IGame,
    cardId: string,
  ): IPlayerInput | undefined {
    if (!hasCardData(cardId)) {
      return undefined;
    }

    const cardData = loadCardData(cardId);
    const rewards = cardData.freeAction ?? [];
    const applyAt = (index: number): IPlayerInput | undefined => {
      const cornerReward = rewards[index];
      if (cornerReward === undefined) {
        return undefined;
      }

      const value = cornerReward.value;
      if (value <= 0) {
        return applyAt(index + 1);
      }
      game.missionTracker.recordEvent({
        type: EMissionEventType.CARD_CORNER_USED,
        resourceType: cornerReward.type,
      });

      switch (cornerReward.type) {
        case EResource.CREDIT:
          player.resources.gain({ credits: value });
          return applyAt(index + 1);
        case EResource.ENERGY:
          player.resources.gain({ energy: value });
          return applyAt(index + 1);
        case EResource.DATA:
          player.resources.gain({ data: value });
          return applyAt(index + 1);
        case EResource.PUBLICITY:
          player.resources.gain({ publicity: value });
          return applyAt(index + 1);
        case EResource.SIGNAL_TOKEN:
          player.resources.gain({ signalTokens: value });
          return applyAt(index + 1);
        case EResource.SCORE:
          player.score += value;
          return applyAt(index + 1);
        case EResource.MOVE:
          player.gainMove(value);
          return applyAt(index + 1);
        case EResource.CARD:
          for (let drawIndex = 0; drawIndex < value; drawIndex += 1) {
            const drawnCardId = game.mainDeck.draw();
            if (drawnCardId === undefined) {
              break;
            }
            player.hand.push(drawnCardId);
            game.lockCurrentTurn();
          }
          return applyAt(index + 1);
        case EResource.CARD_ANY:
          return AnyCardChoiceEffect.execute(player, game, value, () =>
            applyAt(index + 1),
          );
        default:
          return applyAt(index + 1);
      }
    };

    return applyAt(0);
  }
}
