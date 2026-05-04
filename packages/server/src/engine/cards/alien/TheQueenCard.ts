import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { MissionCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutMascamitesCustom,
  createLandThenPickupInput,
} from './MascamitesCardUtils.js';

const CARD_ID = 'ET.6';

export class TheQueen extends MissionCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutMascamitesCustom(CARD_ID, { land: true }),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext) {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) =>
          createLandThenPickupInput(context.player, game, this, {
            allowMoons: true,
          }),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
