import { EResource } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { hasCardData, loadCardData } from '../cards/loadCardData.js';
import { gainIncomeCornerResource as gainSpaceAgencyIncomeCornerResource } from '../cards/spaceAgency/SpaceAgencyCardUtils.js';
import { AnyCardChoiceEffect } from '../effects/card/AnyCardChoiceEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import { EMissionEventType } from '../missions/IMission.js';
import type { IPlayer, TCardItem } from '../player/IPlayer.js';

export function getCardItemId(card: TCardItem): string | undefined {
  if (typeof card === 'string') return card;
  return card.id;
}

export function toSelectionCard(card: TCardItem): { id: string } {
  const cardId = getCardItemId(card);
  if (!cardId) {
    throw new GameError(
      EErrorCode.INVALID_FREE_ACTION,
      'Card row contains an unknown card',
    );
  }
  if (!hasCardData(cardId)) {
    return { id: cardId };
  }
  return loadCardData(cardId);
}

export interface IIndexedCardSelection {
  selectionId: string;
  cardId: string;
  index: number;
  rawItem: TCardItem;
  modelCard: { id: string; [key: string]: unknown };
}

export function buildIndexedCardSelections(
  cards: readonly TCardItem[],
): IIndexedCardSelection[] {
  return cards.map((card, index) => {
    const cardId = getCardItemId(card);
    if (!cardId) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Card selection contains an unknown card',
      );
    }
    const selectionId = `${cardId}@${index}`;
    return {
      selectionId,
      cardId,
      index,
      rawItem: card,
      modelCard: {
        ...toSelectionCard(card),
        id: selectionId,
        cardId,
        _index: index,
      },
    };
  });
}

export function drawCardFromMainDeck(
  player: IPlayer,
  game: IGame,
): string | undefined {
  const cardId = game.mainDeck.drawWithReshuffle(game.random);
  if (cardId === undefined) return undefined;

  player.hand.push(cardId);
  game.lockCurrentTurn();
  return cardId;
}

export function gainIncomeCornerResource(
  player: IPlayer,
  game: IGame,
  cardId: string,
  onComplete?: () => IPlayerInput | undefined,
): IPlayerInput | undefined {
  return gainSpaceAgencyIncomeCornerResource(player, game, cardId, onComplete);
}

export function executeCardFreeActionCornerRewards(
  player: IPlayer,
  game: IGame,
  cardId: string,
  onComplete?: () => IPlayerInput | undefined,
): IPlayerInput | undefined {
  if (!hasCardData(cardId)) {
    return onComplete?.();
  }

  const rewards = loadCardData(cardId).freeAction ?? [];
  const applyAt = (index: number): IPlayerInput | undefined => {
    const cornerReward = rewards[index];
    if (cornerReward === undefined) {
      return onComplete?.();
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
          drawCardFromMainDeck(player, game);
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

export function executeCardFreeActionCornerRewardsInOrder(
  player: IPlayer,
  game: IGame,
  cardIds: readonly string[],
  onComplete?: () => IPlayerInput | undefined,
): IPlayerInput | undefined {
  const applyCardAt = (index: number): IPlayerInput | undefined => {
    const cardId = cardIds[index];
    if (cardId === undefined) {
      return onComplete?.();
    }

    return executeCardFreeActionCornerRewards(player, game, cardId, () =>
      applyCardAt(index + 1),
    );
  };

  return applyCardAt(0);
}
