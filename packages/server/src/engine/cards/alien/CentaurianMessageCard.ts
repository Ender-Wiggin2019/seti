import { EAlienType, type IBaseCard } from '@seti/common/types/BaseCard';
import { isCentauriansAlienBoard } from '../../alien/AlienBoard.js';
import { getCentaurianMessageImmediateBehavior } from '../../alien/CentaurianMessageEffects.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';

export class CentaurianMessageCard extends ImmediateCard {
  public constructor(cardData: IBaseCard) {
    super(cardData, {
      behavior: getCentaurianMessageImmediateBehavior(cardData.id),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    const board = context.game.alienState.getBoardByType(
      EAlienType.CENTAURIANS,
    );
    if (!isCentauriansAlienBoard(board)) {
      return undefined;
    }

    board.sendMessage(context.player.id, this.id, context.player.score);
    return undefined;
  }
}
