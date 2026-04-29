import {
  behaviorWithoutTurnEffectCustom,
  enqueueTurnEffectRegistration,
} from '@/engine/turnEffects/TurnEffects.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '46';
const HANDLED_CUSTOM_ID = 'desc.card-46';

export class AlmaObservatoryCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutTurnEffectCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    let rewarded = false;
    enqueueTurnEffectRegistration(context.player, context.game, {
      id: CARD_ID,
      onSectorCompleted: ({ game, player }) => {
        if (rewarded) return;
        rewarded = true;
        const drawn = game.mainDeck.drawWithReshuffle(game.random);
        if (drawn !== undefined) {
          player.hand.push(drawn);
          game.lockCurrentTurn();
        }
      },
    });
    return undefined;
  }
}
