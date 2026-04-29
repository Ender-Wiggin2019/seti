import { EResource } from '@seti/common/types/element';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.2';
const HANDLED_CUSTOM_ID = 'sa.desc.card_2';

export class TrackingAndDataRelaySatellite extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, () => {
      const options = [EResource.PUBLICITY, EResource.DATA, EResource.MOVE].map(
        (resource) => ({
          id: resource,
          label: `Gain ${resource}`,
          onSelect: () => {
            const count = context.player.hand.filter((card) => {
              const cardId = typeof card === 'string' ? card : card.id;
              if (!cardId) return false;
              return loadCardData(cardId).freeAction?.some(
                (freeAction) => freeAction.type === resource,
              );
            }).length;
            if (resource === EResource.PUBLICITY) {
              context.player.resources.gain({ publicity: count });
            } else if (resource === EResource.DATA) {
              context.player.resources.gain({ data: count });
            } else {
              context.player.gainMove(count);
            }
            return undefined;
          },
        }),
      );
      return new SelectOption(context.player, options, 'Choose an icon');
    });
    return undefined;
  }
}
