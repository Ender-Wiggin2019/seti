import { EResource } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
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
          for (let index = 0; index < discarded.length; index += 1) {
            const cardId = toCardId(discarded[index], `row-card-${index}`);
            game.mainDeck.discard(cardId);
            this.applyCornerReward(context, cardId);
          }
          RefillCardRowEffect.execute(game);
          return undefined;
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }

  private applyCornerReward(
    context: ICardRuntimeContext,
    cardId: string,
  ): void {
    if (!hasCardData(cardId)) return;
    const cardData = loadCardData(cardId);
    for (const cornerReward of cardData.freeAction ?? []) {
      const value = cornerReward.value;
      if (value <= 0) continue;
      context.game.missionTracker.recordEvent({
        type: EMissionEventType.CARD_CORNER_USED,
        resourceType: cornerReward.type,
      });

      switch (cornerReward.type) {
        case EResource.CREDIT:
          context.player.resources.gain({ credits: value });
          break;
        case EResource.ENERGY:
          context.player.resources.gain({ energy: value });
          break;
        case EResource.DATA:
          context.player.resources.gain({ data: value });
          break;
        case EResource.PUBLICITY:
          context.player.resources.gain({ publicity: value });
          break;
        case EResource.SCORE:
          context.player.score += value;
          break;
        case EResource.MOVE:
          context.player.gainMove(value);
          break;
        case EResource.CARD:
        case EResource.CARD_ANY:
          for (let index = 0; index < value; index += 1) {
            const drawn = context.game.mainDeck.draw();
            if (drawn === undefined) break;
            context.player.hand.push(drawn);
            context.game.lockCurrentTurn();
          }
          break;
        default:
          break;
      }
    }
  }
}
