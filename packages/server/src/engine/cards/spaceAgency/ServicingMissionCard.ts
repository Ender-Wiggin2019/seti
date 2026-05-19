import { enqueueTurnEffectRegistration } from '@/engine/turnEffects/TurnEffects.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  hasProbeAdjacentToEarth,
  returnCardToHand,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.5';
const HANDLED_CUSTOM_ID = 'sa.desc.card_5';

export class ServicingMission extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    enqueueTurnEffectRegistration(context.player, context.game, {
      id: `${CARD_ID}:return-to-hand`,
      onMovementStep: ({ game, player }) => {
        if (hasProbeAdjacentToEarth(player, game)) {
          returnCardToHand(player, CARD_ID, game);
        }
        return undefined;
      },
    });
    return undefined;
  }
}
