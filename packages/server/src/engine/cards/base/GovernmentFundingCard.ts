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

function gainImmediateIncomeReward(
  context: ICardRuntimeContext,
  incomeResource: EResource | undefined,
): void {
  if (incomeResource === EResource.CREDIT) {
    context.player.resources.gain({ credits: 1 });
    return;
  }
  if (incomeResource === EResource.ENERGY) {
    context.player.resources.gain({ energy: 1 });
    return;
  }
  if (incomeResource === EResource.DATA) {
    context.player.resources.gain({ data: 1 });
    return;
  }
  if (incomeResource === EResource.CARD) {
    const drawn = context.game.mainDeck.drawWithReshuffle(context.game.random);
    if (drawn !== undefined) {
      context.player.hand.push(drawn);
      context.game.lockCurrentTurn();
    }
  }
}

/**
 * Card No.93 — Government Funding.
 * Score 3 VP for each tucked credit-income card, then tuck this card for income.
 */
export class GovernmentFunding extends ImmediateCard {
  public constructor() {
    super(loadCardData('93'), { behavior: {} });
  }

  public override movesPlayedCardToIncomeAfterPlay(): boolean {
    return true;
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        () => {
          const gained = countIncomeCards(
            context.player.tuckedIncomeCards,
            EResource.CREDIT,
          );
          if (gained > 0) {
            context.player.score += gained * 3;
          }
          const incomeResource = context.player.addTuckedIncomeFromCard(
            context.playedCard ?? this.id,
          );
          gainImmediateIncomeReward(context, incomeResource);
          return undefined;
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
