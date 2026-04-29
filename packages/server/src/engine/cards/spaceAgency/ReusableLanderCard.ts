import { EPlanet } from '@seti/common/types/protocol/enums';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  pushCoreAction,
  returnCardToHand,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.1';
const HANDLED_CUSTOM_ID = 'sa.desc.card_1';

export class ReusableLander extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    const landingCountsBefore = new Map(
      [...(context.game.planetaryBoard?.planets ?? [])].map(
        ([planet, state]) => [planet, state.landingSlots.length],
      ),
    );
    pushCoreAction(context.player, context.game, (game) => {
      for (const [planet, state] of game.planetaryBoard?.planets ?? []) {
        if (planet === EPlanet.EARTH) continue;
        const landingCountBefore = landingCountsBefore.get(planet) ?? 0;
        const ownLander = state.landingSlots.some(
          (slot) => slot.playerId === context.player.id,
        );
        const playerLandedOnThisPlanet =
          state.landingSlots.length > landingCountBefore && ownLander;
        if (playerLandedOnThisPlanet && landingCountBefore >= 1) {
          returnCardToHand(context.player, CARD_ID);
          break;
        }
      }
      return undefined;
    });
    return undefined;
  }
}
