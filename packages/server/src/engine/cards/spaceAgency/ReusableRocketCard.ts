import { EPlanet } from '@seti/common/types/protocol/enums';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  pushCoreAction,
  returnCardToHand,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.14';
const HANDLED_CUSTOM_ID = 'sa.desc.card_14';

export class ReusableRocket extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, (game) => {
      const earth = game.solarSystem?.getSpacesOnPlanet(EPlanet.EARTH)[0];
      const hasOtherProbe = earth?.occupants.some(
        (probe) => probe.playerId !== context.player.id,
      );
      if (hasOtherProbe) returnCardToHand(context.player, CARD_ID);
      return undefined;
    });
    return undefined;
  }
}
