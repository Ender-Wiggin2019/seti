import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  behaviorWithoutTurnEffectCustom,
  enqueueTurnEffectRegistration,
} from '@/engine/turnEffects/TurnEffects.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '25';
const HANDLED_CUSTOM_ID = 'desc.card-25';

export class LightsailCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutTurnEffectCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    const visitedPlanets = new Set<EPlanet>();
    enqueueTurnEffectRegistration(context.player, context.game, {
      id: CARD_ID,
      onPlanetVisited: ({ player }, event) => {
        if (visitedPlanets.has(event.planet)) return;
        visitedPlanets.add(event.planet);
        player.score += 1;
      },
    });
    return undefined;
  }
}
