import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.27';
const HANDLED_CUSTOM_ID = 'sa.desc.card_27';

export class BetterSolarPanels extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, () => {
      if (context.player.resources.energy === 0) {
        context.player.resources.gain({ energy: context.player.probesInSpace });
      }
      return undefined;
    });
    return undefined;
  }
}
