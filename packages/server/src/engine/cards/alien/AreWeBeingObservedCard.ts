import { executeSimpleSlotRewards } from '@/engine/alien/AlienRewards.js';
import { getNextTriggeredAnomalyToken } from '@/engine/alien/plugins/AnomaliesResolver.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { MissionCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  enqueueAnomalyCardEffect,
} from './AnomalyCardBehavior.js';

export class AreWeBeingObservedCard extends MissionCard {
  public constructor() {
    super(loadCardData('ET.17'), { behavior: behaviorWithoutCustom('ET.17') });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    enqueueAnomalyCardEffect(context, (player, game) => {
      const token = getNextTriggeredAnomalyToken(game);
      if (!token) return undefined;
      executeSimpleSlotRewards(player, game, token.rewards);
      return undefined;
    });
    return undefined;
  }
}
