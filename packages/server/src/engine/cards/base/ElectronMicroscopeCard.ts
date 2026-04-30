import { ETrace } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.99 - Electron Microscope.
 * Mark a yellow trace for a species where you already have a yellow trace.
 */
export class ElectronMicroscopeCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('99'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) =>
          game.alienState.createTraceInput(
            context.player,
            game,
            ETrace.YELLOW,
            {
              alien: game.alienState.boards
                .filter(
                  (board) =>
                    game.alienState.getPlayerTraceCount(
                      context.player,
                      ETrace.YELLOW,
                      board.alienIndex,
                    ) > 0,
                )
                .map((board) => board.alienIndex),
            },
          ),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
