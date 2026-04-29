import { getNextTriggeredAnomalyToken } from '@/engine/alien/plugins/AnomaliesResolver.js';
import { MarkSectorSignalEffect } from '@/engine/effects/index.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  enqueueAnomalyCardEffect,
} from './AnomalyCardBehavior.js';

export class ListeningCarefullyCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('ET.14'), { behavior: behaviorWithoutCustom('ET.14') });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    enqueueAnomalyCardEffect(context, (player, game) => {
      const token = getNextTriggeredAnomalyToken(game);
      if (!token) return undefined;
      return MarkSectorSignalEffect.markByIndexWithAlternatives(
        player,
        game,
        token.sectorIndex,
      );
    });
    return undefined;
  }
}
