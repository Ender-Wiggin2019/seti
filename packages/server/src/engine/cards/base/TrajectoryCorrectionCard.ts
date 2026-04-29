import {
  behaviorWithoutTurnEffectCustom,
  enqueueTurnEffectRegistration,
} from '@/engine/turnEffects/TurnEffects.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '125';
const HANDLED_CUSTOM_ID = 'desc.card-125';

export class TrajectoryCorrectionCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutTurnEffectCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    let rewarded = false;
    enqueueTurnEffectRegistration(context.player, context.game, {
      id: CARD_ID,
      onMovementStep: ({ player }, event) => {
        if (rewarded || event.fromSpace.ringIndex !== event.toSpace.ringIndex) {
          return;
        }
        rewarded = true;
        player.score += 3;
        player.resources.gain({ publicity: 1 });
      },
    });
    return undefined;
  }
}
