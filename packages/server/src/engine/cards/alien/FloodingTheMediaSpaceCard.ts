import { EAlienType } from '@seti/common/types/protocol/enums';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  enqueueAnomalyCardEffect,
} from './AnomalyCardBehavior.js';

export class FloodingTheMediaSpaceCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('ET.16'), { behavior: behaviorWithoutCustom('ET.16') });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    enqueueAnomalyCardEffect(context, (player, game) => {
      const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
      if (!board) return undefined;

      for (let i = 0; i < 3; i += 1) {
        const source = board.faceUpAlienCardId ? 'face-up' : 'deck';
        const drawn = game.alienState.drawAlienCard(
          player,
          board,
          source,
          game,
        );
        if (!drawn) break;
      }
      return undefined;
    });
    return undefined;
  }
}
