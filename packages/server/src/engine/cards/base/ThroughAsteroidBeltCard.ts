import {
  behaviorWithoutTurnEffectCustom,
  enqueueTurnEffectRegistration,
} from '@/engine/turnEffects/TurnEffects.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '26';
const HANDLED_CUSTOM_ID = 'desc.card-26';

export class ThroughAsteroidBeltCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutTurnEffectCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    enqueueTurnEffectRegistration(context.player, context.game, {
      id: CARD_ID,
      ignoreAsteroidLeaveCost: true,
    });
    return undefined;
  }
}
