import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { LaunchProbeEffect } from '@/engine/effects/index.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '9';

export class FalconHeavyCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          const originalLimit = context.player.probeSpaceLimit;
          context.player.probeSpaceLimit = Math.max(
            originalLimit,
            context.player.probesInSpace + 2,
          );
          try {
            for (let i = 0; i < 2; i += 1) {
              if (LaunchProbeEffect.canExecute(context.player, game)) {
                LaunchProbeEffect.execute(context.player, game);
              }
            }
          } finally {
            context.player.probeSpaceLimit = originalLimit;
          }
          context.player.resources.gain({ publicity: 1 });
          return undefined;
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
