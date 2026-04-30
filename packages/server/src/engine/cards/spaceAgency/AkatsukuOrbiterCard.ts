import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  countComputerTechs,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.30';
const HANDLED_CUSTOM_ID = 'sa.desc.card_30';

export class AkatsukuOrbiter extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, () => {
      context.player.resources.gain({
        data: countComputerTechs(context.player),
      });
      return undefined;
    });
    return undefined;
  }
}
