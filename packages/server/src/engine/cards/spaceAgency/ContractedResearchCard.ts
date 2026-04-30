import { RotateDiscEffect } from '@/engine/effects/solar/RotateDiscEffect.js';
import { ResearchTechEffect } from '@/engine/effects/tech/ResearchTechEffect.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustomAnd,
  pushCoreAction,
  researchedByAnotherPlayerTechIds,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.18';
const HANDLED_CUSTOM_IDS = ['sa.desc.card_18', 'sa.desc.card_18_2'] as const;

export class ContractedResearch extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustomAnd(CARD_ID, HANDLED_CUSTOM_IDS, [
        'rotateSolarSystem',
        'researchTech',
      ]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, (game) => {
      context.player.resources.setPublicity(0);
      RotateDiscEffect.execute(game);

      const techIds = researchedByAnotherPlayerTechIds(game, context.player.id);
      if (techIds.length === 0) return undefined;

      return ResearchTechEffect.execute(context.player, game, {
        filter: { mode: 'specific', techIds },
      });
    });
    return undefined;
  }
}
