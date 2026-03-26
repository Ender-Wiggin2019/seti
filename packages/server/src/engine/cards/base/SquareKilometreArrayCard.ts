import { EMarkSource, Mark } from '@/engine/cards/utils/Mark.js';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.50 - Square Kilometre Array
 *
 * This effect marks signals from displayed card colors and is intentionally
 * NOT treated as Scan action.
 */
export class SquareKilometreArray extends ImmediateCard {
  public constructor() {
    super(loadCardData('50'), {
      behavior: {},
    });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        () => {
          const runtimeGame = context.player.game ?? context.game;
          if (
            runtimeGame &&
            typeof (runtimeGame as { mark?: unknown }).mark === 'function'
          ) {
            return runtimeGame.mark(EMarkSource.CARD_ROW, 3, context.player.id);
          }
          return Mark.execute(
            context.player,
            context.game,
            EMarkSource.CARD_ROW,
            3,
          );
        },
        EPriority.DEFAULT,
      ),
    );
    return undefined;
  }
}
