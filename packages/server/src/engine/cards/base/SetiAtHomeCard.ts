import { ETrace } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.108 — SETI@Home.
 * If you have at least 8 publicity, mark a red trace.
 */
export class SetiAtHome extends ImmediateCard {
  public constructor() {
    super(loadCardData('108'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          if (context.player.resources.publicity < 8) return undefined;
          return game.markTrace(ETrace.RED, context.player.id);
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
