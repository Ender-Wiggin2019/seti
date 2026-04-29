import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { buildLandPlanetSelection } from '@/engine/effects/index.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '13';

export class PerseveranceRoverCard extends ImmediateCard {
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
          buildLandPlanetSelection(context.player, game, {
            prompt: 'Select a planet to land on',
            includeSkipOption: false,
            payCost: false,
            onLanded: (result) => {
              if (
                result.planet === EPlanet.MARS ||
                result.planet === EPlanet.MERCURY ||
                result.isMoon
              ) {
                context.player.score += 4;
              }
            },
          }),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
