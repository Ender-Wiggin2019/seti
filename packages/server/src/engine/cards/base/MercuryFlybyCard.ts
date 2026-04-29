import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  behaviorWithoutTurnEffectCustom,
  enqueueTurnEffectRegistration,
} from '@/engine/turnEffects/TurnEffects.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '20';
const HANDLED_CUSTOM_ID = 'desc.card-20';

export class MercuryFlybyCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutTurnEffectCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    let rewarded = false;
    enqueueTurnEffectRegistration(context.player, context.game, {
      id: CARD_ID,
      onPlanetVisited: ({ player }, event) => {
        if (rewarded || event.planet !== EPlanet.MERCURY) return;
        rewarded = true;
        player.score += 4;
      },
    });
    return undefined;
  }
}
