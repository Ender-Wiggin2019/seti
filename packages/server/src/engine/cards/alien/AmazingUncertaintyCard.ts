import { countPlayerSignalsInAnomalySectors } from '@/engine/alien/plugins/AnomaliesResolver.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  enqueueAnomalyCardEffect,
} from './AnomalyCardBehavior.js';

export class AmazingUncertaintyCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('ET.20'), { behavior: behaviorWithoutCustom('ET.20') });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    enqueueAnomalyCardEffect(context, (player, game) => {
      const signalCount = countPlayerSignalsInAnomalySectors(game, player.id);
      if (signalCount > 0) {
        player.score += signalCount;
      }
      return undefined;
    });
    return undefined;
  }
}
