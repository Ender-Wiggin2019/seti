import { ETrace } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.100 - Exascale Supercomputer.
 * Mark a blue trace for a species where you already have a blue trace.
 */
export class ExascaleSupercomputerCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('100'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) =>
          game.alienState.createTraceInput(context.player, game, ETrace.BLUE, {
            alien: game.alienState.boards
              .filter(
                (board) =>
                  game.alienState.getPlayerTraceCount(
                    context.player,
                    ETrace.BLUE,
                    board.alienIndex,
                  ) > 0,
              )
              .map((board) => board.alienIndex),
          }),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
