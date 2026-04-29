import { ETech } from '@seti/common/types/element';
import { ResearchTechAction } from '@/engine/actions/ResearchTech.js';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import {
  ResearchTechEffect,
  type TResearchTechFilter,
} from '@/engine/effects/tech/ResearchTechEffect.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const COMPUTER_TECH_FILTER: TResearchTechFilter = {
  mode: 'category' as const,
  categories: [ETech.COMPUTER],
};

/**
 * Card No.119 — PIXL.
 * Rotate, research a computer tech, then score 1 VP per publicity.
 */
export class PIXL extends ImmediateCard {
  public constructor() {
    super(loadCardData('119'), {
      behavior: {
        rotateSolarSystem: true,
      },
    });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.pushMultiple([
      new SimpleDeferredAction(
        context.player,
        (game) => {
          if (
            !ResearchTechEffect.canExecute(
              context.player,
              game,
              COMPUTER_TECH_FILTER,
            )
          ) {
            return undefined;
          }
          return ResearchTechAction.execute(
            context.player,
            game,
            true,
            COMPUTER_TECH_FILTER,
            { skipRotation: true },
          );
        },
        EPriority.CORE_EFFECT,
      ),
      new SimpleDeferredAction(
        context.player,
        () => {
          context.player.score += context.player.resources.publicity;
          return undefined;
        },
        EPriority.CORE_EFFECT,
      ),
    ]);
    return undefined;
  }
}
