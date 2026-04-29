import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { ScanEffect } from '@/engine/effects/scan/ScanEffect.js';
import { getSectorIndexByPlanet } from '@/engine/effects/scan/ScanEffectUtils.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import { EMarkSource } from '../utils/Mark.js';

/**
 * Card No.55 - Arecibo Observatory.
 * Perform SCAN, then mark one signal in any sector.
 */
export class AreciboObservatoryCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('55'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          const earthSectorIndex = game.solarSystem
            ? (getSectorIndexByPlanet(game.solarSystem, EPlanet.EARTH) ?? 0)
            : 0;

          return ScanEffect.execute(context.player, game, {
            earthSectorIndex,
            onComplete: () => game.mark(EMarkSource.ANY, 1, context.player.id),
          });
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
