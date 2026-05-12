import { EResource } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { AnyCardChoiceEffect } from '@/engine/effects/card/AnyCardChoiceEffect.js';
import { RefillCardRowEffect } from '@/engine/effects/index.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { hasCardData, loadCardData } from '../loadCardData.js';

function toCardId(card: TCardItem, fallback: string): string {
  if (typeof card === 'string') return card;
  return card.id ?? fallback;
}

/**
 * Card No.73 - Clean Space Initiative.
 * Discard all cards from the card row for their free-action corner rewards.
 */
export class CleanSpaceInitiativeCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('73'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          const discarded = game.cardRow.splice(0, 3);
          const discardedIds = discarded.map((card, index) =>
            toCardId(card, `row-card-${index}`),
          );
          for (const cardId of discardedIds) {
            game.mainDeck.discard(cardId);
          }
          RefillCardRowEffect.execute(game);
          return this.applyCornerRewards(context, discardedIds);
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }

  private applyCornerRewards(
    context: ICardRuntimeContext,
    cardIds: readonly string[],
  ): IPlayerInput | undefined {
    const applyCardAt = (index: number): IPlayerInput | undefined => {
      const cardId = cardIds[index];
      if (cardId === undefined) return undefined;
      return this.applyCornerReward(context, cardId, () =>
        applyCardAt(index + 1),
      );
    };

    return applyCardAt(0);
  }

  private applyCornerReward(
    context: ICardRuntimeContext,
    cardId: string,
    onComplete?: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    if (!hasCardData(cardId)) return onComplete?.();
    const cardData = loadCardData(cardId);
    const rewards = cardData.freeAction ?? [];
    const applyAt = (index: number): IPlayerInput | undefined => {
      const cornerReward = rewards[index];
      if (cornerReward === undefined) return onComplete?.();

      const value = cornerReward.value;
      if (value <= 0) return applyAt(index + 1);
      context.game.missionTracker.recordEvent({
        type: EMissionEventType.CARD_CORNER_USED,
        resourceType: cornerReward.type,
      });

      switch (cornerReward.type) {
        case EResource.CREDIT:
          context.player.resources.gain({ credits: value });
          return applyAt(index + 1);
        case EResource.ENERGY:
          context.player.resources.gain({ energy: value });
          return applyAt(index + 1);
        case EResource.DATA:
          context.player.resources.gain({ data: value });
          return applyAt(index + 1);
        case EResource.PUBLICITY:
          context.player.resources.gain({ publicity: value });
          return applyAt(index + 1);
        case EResource.SIGNAL_TOKEN:
          context.player.resources.gain({ signalTokens: value });
          return applyAt(index + 1);
        case EResource.SCORE:
          context.player.score += value;
          return applyAt(index + 1);
        case EResource.MOVE:
          context.player.gainMove(value);
          return applyAt(index + 1);
        case EResource.CARD:
          for (let drawIndex = 0; drawIndex < value; drawIndex += 1) {
            const drawn = context.game.mainDeck.draw();
            if (drawn === undefined) break;
            context.player.hand.push(drawn);
            context.game.lockCurrentTurn();
          }
          return applyAt(index + 1);
        case EResource.CARD_ANY:
          return AnyCardChoiceEffect.execute(
            context.player,
            context.game,
            value,
            () => applyAt(index + 1),
          );
        default:
          return applyAt(index + 1);
      }
    };

    return applyAt(0);
  }
}
