import { ETrace } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.98 - Coronal Spectrograph.
 * Mark a red trace for a species where you already have a red trace.
 */
export class CoronalSpectrographCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('98'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) =>
          game.alienState.createTraceInput(context.player, game, ETrace.RED, {
            alien: game.alienState.boards
              .filter(
                (board) =>
                  game.alienState.getPlayerTraceCount(
                    context.player,
                    ETrace.RED,
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
