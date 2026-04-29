import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.38';
const HANDLED_CUSTOM_ID = 'sa.desc.card_38';

export class SpaceRendezvous extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, (game) => {
      const hasRendezvous = game.solarSystem?.spaces.some(
        (space) =>
          space.occupants.some(
            (probe) => probe.playerId === context.player.id,
          ) && space.occupants.length >= 2,
      );
      if (hasRendezvous) {
        context.player.score += 3;
      }
      return undefined;
    });
    return undefined;
  }
}
