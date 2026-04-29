import { disableMovementPublicityForCurrentTurn } from '@/engine/alien/plugins/AnomaliesTurnEffects.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  enqueueAnomalyCardEffect,
} from './AnomalyCardBehavior.js';

export class CloseUpViewCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('ET.12'), { behavior: behaviorWithoutCustom('ET.12') });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    enqueueAnomalyCardEffect(context, (player, game) => {
      disableMovementPublicityForCurrentTurn(game, player.id);
      return undefined;
    });
    return undefined;
  }
}
