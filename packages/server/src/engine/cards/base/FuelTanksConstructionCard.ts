import { EResource } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { hasCardData, loadCardData } from '../loadCardData.js';

function toCardId(card: TCardItem, fallback: string): string {
  if (typeof card === 'string') return card;
  return card.id ?? fallback;
}

function countIncomeCards(cards: TCardItem[], targetIncome: EResource): number {
  let count = 0;
  for (let i = 0; i < cards.length; i += 1) {
    const cardId = toCardId(cards[i], `card-${i}`);
    if (!hasCardData(cardId)) continue;
    if (loadCardData(cardId).income === targetIncome) {
      count += 1;
    }
  }
  return count;
}

/**
 * Card No.90 — Fuel Tanks Construction.
 * Gain 1 energy for each energy-income card shown from hand.
 */
export class FuelTanksConstruction extends ImmediateCard {
  public constructor() {
    super(loadCardData('90'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        () => {
          const gained = countIncomeCards(
            context.player.hand,
            EResource.ENERGY,
          );
          if (gained > 0) {
            context.player.resources.gain({ energy: gained });
          }
          return undefined;
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
