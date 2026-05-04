import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { MissionCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutMascamitesCustom,
  createOrbitOrLandThenPickupInput,
} from './MascamitesCardUtils.js';

const CARD_ID = 'ET.3';

export class MassSampleCollection extends MissionCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutMascamitesCustom(CARD_ID),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext) {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => createOrbitOrLandThenPickupInput(context.player, game, this),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
