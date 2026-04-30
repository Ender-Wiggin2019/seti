import type { EPlanet } from '@seti/common/types/protocol/enums';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.19';
const HANDLED_CUSTOM_ID = 'sa.desc.card_19';

export class NewAssignment extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, (game) => {
      const planetaryBoard = game.planetaryBoard;
      const solarSystem = game.solarSystem;
      if (!planetaryBoard || !solarSystem) return undefined;

      const options = [...planetaryBoard.planets.entries()].flatMap(
        ([planet, state]) =>
          state.orbitSlots
            .map((slot, slotIndex) => ({ planet, state, slot, slotIndex }))
            .filter(
              (target) =>
                target.slot.playerId === context.player.id &&
                solarSystem.getPlanetLocation(target.planet) !== null,
            )
            .map((target) => ({
              id: `orbit-${target.planet}-${target.slotIndex}`,
              label: `Return orbiter from ${target.planet}`,
              onSelect: () => {
                target.state.orbitSlots.splice(target.slotIndex, 1);
                if (target.slotIndex === 0) {
                  target.state.firstOrbitClaimed = false;
                }
                const location = solarSystem.getPlanetLocation(
                  target.planet as EPlanet,
                );
                if (location) {
                  solarSystem.placeProbe(context.player.id, location.space.id);
                  context.player.probesInSpace += 1;
                }
                return undefined;
              },
            })),
      );

      if (options.length === 0) return undefined;
      return new SelectOption(
        context.player,
        options,
        'Select an orbiter to reassign',
      );
    });
    return undefined;
  }
}
