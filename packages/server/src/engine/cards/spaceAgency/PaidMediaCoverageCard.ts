import { SelectOption } from '@/engine/input/SelectOption.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.17';
const HANDLED_CUSTOM_ID = 'sa.desc.card_17';

export class PaidMediaCoverage extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, () => {
      const credits = context.player.resources.credits;
      const options = Array.from({ length: credits + 1 }, (_, amount) => ({
        id: `spend-${amount}-credit`,
        label: `Spend ${amount} credit`,
        onSelect: () => {
          if (amount > 0) {
            context.player.resources.spend({ credits: amount });
            context.player.score += amount * 2;
            context.player.resources.gain({ publicity: amount * 2 });
          }
          return undefined;
        },
      }));
      return new SelectOption(context.player, options, 'Spend credits');
    });
    return undefined;
  }
}
