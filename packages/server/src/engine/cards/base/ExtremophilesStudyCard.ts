import { ETrace } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CONCRETE_TRACES: readonly ETrace[] = [
  ETrace.RED,
  ETrace.YELLOW,
  ETrace.BLUE,
];

/**
 * Card No.75 - Extremophiles Study.
 * Mark any trace, then gain 1 VP for each trace you have in that color.
 */
export class ExtremophilesStudyCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('75'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          if (!game.alienState) {
            context.player.traces[ETrace.ANY] =
              (context.player.traces[ETrace.ANY] ?? 0) + 1;
            return undefined;
          }

          const beforeCounts = new Map(
            CONCRETE_TRACES.map((trace) => [
              trace,
              game.alienState.getPlayerTraceCount(context.player, trace),
            ]),
          );

          return game.alienState.createTraceInput(
            context.player,
            game,
            ETrace.ANY,
            {
              onComplete: () => {
                for (const trace of CONCRETE_TRACES) {
                  const currentCount = game.alienState.getPlayerTraceCount(
                    context.player,
                    trace,
                  );
                  if (currentCount > (beforeCounts.get(trace) ?? 0)) {
                    context.player.score += currentCount;
                    break;
                  }
                }
                return undefined;
              },
            },
          );
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
