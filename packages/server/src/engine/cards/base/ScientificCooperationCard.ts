import { ETech } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  otherPlayerHasTech,
  rotateAndResearchTech,
} from './baseTechCardUtils.js';

const CARD_ID = '72';

export class ScientificCooperationCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) =>
          rotateAndResearchTech(
            context.player,
            game,
            [ETech.PROBE, ETech.SCAN, ETech.COMPUTER],
            (techId) => {
              if (otherPlayerHasTech(context.player, game, techId)) {
                context.player.resources.gain({ publicity: 2 });
              }
              return undefined;
            },
          ),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
