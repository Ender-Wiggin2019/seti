import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { buildLandPlanetSelection } from '@/engine/effects/index.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { EndGameScoringCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '12';

export class EuropaClipperCard extends EndGameScoringCard {
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
            prompt: 'Select a planet or moon to land on',
            allowMoons: true,
          }),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
