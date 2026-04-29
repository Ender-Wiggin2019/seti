import { SelectOption } from '@/engine/input/SelectOption.js';
import {
  behaviorWithoutTurnEffectCustom,
  enqueueTurnEffectRegistration,
} from '@/engine/turnEffects/TurnEffects.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '19';
const HANDLED_CUSTOM_ID = 'desc.card-19';

export class GravitationalSlingshotCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutTurnEffectCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    enqueueTurnEffectRegistration(context.player, context.game, {
      id: CARD_ID,
      onPlanetVisited: ({ player }, event) => {
        if (!event.movement || event.movement.publicityGained <= 0) {
          return;
        }

        return new SelectOption(
          player,
          [
            {
              id: 'convert-publicity',
              label: 'Gain 1 movement instead of 1 publicity',
              onSelect: () => {
                if (event.movement && event.movement.publicityGained > 0) {
                  event.movement.publicityGained -= 1;
                  event.publicityGained = Math.max(
                    0,
                    event.publicityGained - 1,
                  );
                  player.gainMove(1);
                }
                return undefined;
              },
            },
            {
              id: 'keep-publicity',
              label: 'Keep 1 publicity',
              onSelect: () => undefined,
            },
          ],
          'Gravitational Slingshot',
        );
      },
    });
    return undefined;
  }
}
