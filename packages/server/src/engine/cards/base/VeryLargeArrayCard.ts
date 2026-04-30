import {
  behaviorWithoutTurnEffectCustom,
  enqueueTurnEffectRegistration,
} from '@/engine/turnEffects/TurnEffects.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '47';
const HANDLED_CUSTOM_ID = 'desc.card-47';

export class VeryLargeArrayCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutTurnEffectCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    let rewarded = false;
    enqueueTurnEffectRegistration(context.player, context.game, {
      id: CARD_ID,
      onSectorCompleted: ({ player }) => {
        if (rewarded) return;
        rewarded = true;
        player.resources.gain({ data: 1 });
      },
    });
    return undefined;
  }
}
