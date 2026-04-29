import {
  getAnomalyTokenAtSector,
  getEarthSectorIndex,
} from '@/engine/alien/plugins/AnomaliesResolver.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  enqueueAnomalyCardEffect,
} from './AnomalyCardBehavior.js';

export class SignsOfLifeCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('ET.11'), { behavior: behaviorWithoutCustom('ET.11') });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    enqueueAnomalyCardEffect(context, (player, game) => {
      const earthSector = getEarthSectorIndex(game);
      if (earthSector === undefined) return undefined;
      const token = getAnomalyTokenAtSector(game, earthSector);
      if (!token) return undefined;
      player.gainMove(1);
      return undefined;
    });
    return undefined;
  }
}
