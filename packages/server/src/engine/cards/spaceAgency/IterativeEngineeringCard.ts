import { ETech } from '@seti/common/types/element';
import {
  ETechBonusType,
  type ITechBonusToken,
  type TTechCategory,
} from '@seti/common/types/tech';
import { ResearchTechEffect } from '@/engine/effects/tech/ResearchTechEffect.js';
import { TechBonusEffect } from '@/engine/effects/tech/TechBonusEffect.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustomAnd,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.15';
const HANDLED_CUSTOM_ID = 'sa.desc.card_15';
const REPLAYABLE_BONUSES = new Set<ETechBonusType>([
  ETechBonusType.VP_3,
  ETechBonusType.PUBLICITY,
  ETechBonusType.ENERGY,
  ETechBonusType.CARD,
]);
const ANY_TECH_CATEGORIES: TTechCategory[] = [
  ETech.PROBE,
  ETech.SCAN,
  ETech.COMPUTER,
];

function replayPrintedBonus(
  context: ICardRuntimeContext,
  bonus: ITechBonusToken | undefined,
): void {
  if (!bonus || !REPLAYABLE_BONUSES.has(bonus.type)) return;
  TechBonusEffect.apply(context.player, context.game, bonus);
}

export class IterativeEngineering extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustomAnd(
        CARD_ID,
        [HANDLED_CUSTOM_ID],
        ['researchTech'],
      ),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, (game) => {
      const filter = {
        mode: 'category' as const,
        categories: ANY_TECH_CATEGORIES,
      };
      if (!ResearchTechEffect.canExecute(context.player, game, filter)) {
        return undefined;
      }

      return ResearchTechEffect.execute(context.player, game, {
        filter,
        onComplete: (result) => {
          replayPrintedBonus(context, result.tileBonus);
          return undefined;
        },
      });
    });
    return undefined;
  }
}
