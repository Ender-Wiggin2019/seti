import { ETech } from '@seti/common/types/element';
import type { TTechCategory } from '@seti/common/types/tech';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { ResearchTechEffect } from '@/engine/effects/index.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import {
  type ISelectOptionEntry,
  SelectOption,
} from '@/engine/input/SelectOption.js';
import { EndGameScoringCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import { rotateAndResearchTech } from './baseTechCardUtils.js';

const CARD_ID = '126';

export class EuclidTelescopeConstructionCard extends EndGameScoringCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          const options = buildResearchOptions(context, game);
          if (options.length === 0) return undefined;
          if (options.length === 1) return options[0].onSelect();
          return new SelectOption(
            context.player,
            options,
            'Choose a technology type',
          );
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}

function buildResearchOptions(
  context: ICardRuntimeContext,
  game: ICardRuntimeContext['game'],
): ISelectOptionEntry[] {
  const options: ISelectOptionEntry[] = [];
  const probeCategories: TTechCategory[] = [ETech.PROBE];
  const scanCategories: TTechCategory[] = [ETech.SCAN];
  const probeFilter = {
    mode: 'category' as const,
    categories: probeCategories,
  };
  const scanFilter = { mode: 'category' as const, categories: scanCategories };

  if (ResearchTechEffect.canExecute(context.player, game, probeFilter)) {
    options.push({
      id: 'research-probe-tech',
      label: 'Research probe tech',
      onSelect: () =>
        rotateAndResearchTech(context.player, game, probeCategories),
    });
  }

  if (ResearchTechEffect.canExecute(context.player, game, scanFilter)) {
    options.push({
      id: 'research-scan-tech',
      label: 'Research scan tech',
      onSelect: () =>
        rotateAndResearchTech(context.player, game, scanCategories),
    });
  }

  return options;
}
