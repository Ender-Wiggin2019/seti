import { EErrorCode } from '@seti/common/types/protocol/errors';
import { RESEARCH_PUBLICITY_COST } from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';
import { RotateDiscEffect } from '../effects/solar/RotateDiscEffect.js';
import {
  type IResearchTechResult,
  ResearchTechEffect,
  type TResearchTechFilter,
} from '../effects/tech/ResearchTechEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IResearchTechActionResult extends IResearchTechResult {
  rotatedDisc: number;
}

export class ResearchTechAction {
  /**
   * @param isCardEffect - true when granted by a card (skips publicity cost)
   */
  public static canExecute(
    player: IPlayer,
    game: IGame,
    isCardEffect = false,
    filter?: TResearchTechFilter,
  ): boolean {
    if (
      !isCardEffect &&
      !player.resources.has({ publicity: RESEARCH_PUBLICITY_COST })
    ) {
      return false;
    }

    return ResearchTechEffect.canExecute(player, game, filter);
  }

  /**
   * Execute the research tech action.
   *
   * Returns a `PlayerInput` when the player must choose from multiple
   * available techs, or `undefined` when auto-selected (single option).
   */
  public static execute(
    player: IPlayer,
    game: IGame,
    isCardEffect = false,
    filter?: TResearchTechFilter,
  ): IPlayerInput | undefined {
    const hasAvailableTech = ResearchTechEffect.canExecute(
      player,
      game,
      filter,
    );
    const shouldIgnoreDuplicateSpecificCardEffect =
      isCardEffect &&
      filter?.mode === 'specific' &&
      filter.techIds.length > 0 &&
      !hasAvailableTech;

    if (shouldIgnoreDuplicateSpecificCardEffect) {
      // Card-effect path: rotation (if any) is driven by the card's own
      // ROTATE icon via `BehaviorExecutor.buildRotateAction`, so we do
      // not rotate here when the grant is a no-op.
      return undefined;
    }

    if (!this.canExecute(player, game, isCardEffect, filter)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'ResearchTech action is not currently legal',
        { playerId: player.id },
      );
    }

    if (!isCardEffect) {
      player.resources.spend({ publicity: RESEARCH_PUBLICITY_COST });
      // Only the main RESEARCH_TECH action pays publicity AND rotates. The
      // card-effect path keeps rotation decoupled: if the card has a
      // printed ROTATE icon, `buildRotateAction` rotates once; otherwise
      // the card was authored without rotation by design (e.g. card 81).
      RotateDiscEffect.execute(game);
    }

    return ResearchTechEffect.execute(player, game, {
      filter,
      onComplete: (_result) => {
        return undefined;
      },
    });
  }
}
