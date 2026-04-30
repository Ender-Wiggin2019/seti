import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { buildLandPlanetSelection } from '@/engine/effects/index.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.16 - Dragonfly
 *
 * Grants a LAND action that ignores the occupied-slot restriction.
 */
export class Dragonfly extends ImmediateCard {
  public constructor() {
    super(loadCardData('16'), {
      behavior: {},
    });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) =>
          buildLandPlanetSelection(context.player, game, {
            allowDuplicate: true,
            prompt: 'Dragonfly: Select a planet to land on',
          }),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
