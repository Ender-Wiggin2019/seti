import { loadCardData } from '../loadCardData.js';
import { EndGameScoringCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import {
  behaviorWithoutMascamitesCustom,
  createPickupBackInput,
} from './MascamitesCardUtils.js';

const CARD_ID = 'ET.5';

export class EcosystemStudy extends EndGameScoringCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutMascamitesCustom(CARD_ID),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext) {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) =>
          createPickupBackInput(context.player, game, {
            requireOwnProbe: true,
          }),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
