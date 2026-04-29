import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.83 - Wow! Signal
 *
 * Gain publicity and mark both printed signals in the sector with Earth.
 */
export class WowSignalCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('83'), {
      behavior: {
        gainResources: { publicity: 1 },
      },
    });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => this.markEarthSector(context.player, game, 2),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }

  private markEarthSector(
    player: IPlayer,
    game: IGame,
    remainingCount: number,
  ): IPlayerInput | undefined {
    if (remainingCount <= 0) return undefined;

    return MarkSectorSignalEffect.markByPlanetWithAlternatives(
      player,
      game,
      EPlanet.EARTH,
      () => this.markEarthSector(player, game, remainingCount - 1),
    );
  }
}
