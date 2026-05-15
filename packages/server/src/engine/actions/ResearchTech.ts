import { EErrorCode } from '@seti/common/types/protocol/errors';
import { RESEARCH_PUBLICITY_COST } from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';
import { RotateDiscEffect } from '../effects/solar/RotateDiscEffect.js';
import {
  type IResearchTechResult,
  ResearchTechEffect,
  type TResearchTechFilter,
} from '../effects/tech/ResearchTechEffect.js';
import {
  EGameRuntimeEvent,
  type IGameRuntimeEventContext,
} from '../events/GameEventBus.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IResearchTechActionResult extends IResearchTechResult {
  rotatedDisc: number;
}

export interface IResearchTechActionOptions {
  skipRotation?: boolean;
}

interface IResearchTechRuntimeEventContext extends IGameRuntimeEventContext {
  type: EGameRuntimeEvent.RESEARCH_TECH;
  game: IGame;
  player: IPlayer;
  isCardEffect: boolean;
  filter?: TResearchTechFilter;
  skipRotation?: boolean;
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
    options: IResearchTechActionOptions = {},
  ): IPlayerInput | undefined {
    const eventContext = game.eventBus?.emit<IResearchTechRuntimeEventContext>({
      type: EGameRuntimeEvent.RESEARCH_TECH,
      game,
      player,
      isCardEffect,
      filter,
      skipRotation: options.skipRotation === true,
    });
    const effectiveFilter = eventContext?.filter ?? filter;
    const shouldRotate =
      (eventContext?.skipRotation ?? options.skipRotation) !== true;
    const hasAvailableTech = ResearchTechEffect.canExecute(
      player,
      game,
      effectiveFilter,
    );
    const shouldSkipUnavailableCardEffect = isCardEffect && !hasAvailableTech;

    if (shouldSkipUnavailableCardEffect) {
      if (shouldRotate) {
        RotateDiscEffect.execute(game);
      }
      return undefined;
    }

    if (!this.canExecute(player, game, isCardEffect, effectiveFilter)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'ResearchTech action is not currently legal',
        { playerId: player.id },
      );
    }

    if (shouldRotate) {
      RotateDiscEffect.execute(game);
    }

    if (!isCardEffect) {
      player.resources.spend({ publicity: RESEARCH_PUBLICITY_COST });
    }

    return ResearchTechEffect.execute(player, game, {
      filter: effectiveFilter,
      onComplete: (_result) => {
        return undefined;
      },
    });
  }
}
