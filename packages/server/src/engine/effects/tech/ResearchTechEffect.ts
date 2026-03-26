import type { ETech } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  type ETechId,
  getTechDescriptor,
  type TTechCategory,
} from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';

export interface IResearchTechResult {
  techId: ETechId;
  vpBonus: number;
}

/**
 * Filter configuration for narrowing the set of available techs.
 *
 * - `'all'`       – every available tech the player can research
 * - `category`    – only techs of one or more categories (ETech.PROBE etc.)
 * - `specific`    – an explicit whitelist of tech IDs
 */
export type TResearchTechFilter =
  | { mode: 'all' }
  | { mode: 'category'; categories: TTechCategory[] }
  | { mode: 'specific'; techIds: ETechId[] };

export interface IResearchTechEffectOptions {
  filter?: TResearchTechFilter;
  /**
   * Callback fired after the tech is acquired.
   * Return a `PlayerInput` to chain further interaction.
   */
  onComplete?: (result: IResearchTechResult) => IPlayerInput | undefined;
}

/**
 * Interactive effect: present available techs to the player and acquire the
 * selected one.
 *
 * Does **not** pay costs (publicity, etc.) — that is the responsibility of
 * the calling Action or card.
 */
export class ResearchTechEffect {
  public static canExecute(
    player: IPlayer,
    game: IGame,
    filter?: TResearchTechFilter,
  ): boolean {
    if (game.techBoard === null) return false;
    return this.getFilteredTechs(player, game, filter).length > 0;
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    options: IResearchTechEffectOptions = {},
  ): IPlayerInput | undefined {
    const techs = this.getFilteredTechs(player, game, options.filter);

    if (techs.length === 0) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No techs available to research',
        { playerId: player.id },
      );
    }

    if (techs.length === 1) {
      const result = this.acquireTech(player, game, techs[0]);
      return options.onComplete?.(result);
    }

    return new SelectOption(
      player,
      techs.map((techId) => ({
        id: techId,
        label: techId,
        onSelect: () => {
          const result = this.acquireTech(player, game, techId);
          return options.onComplete?.(result);
        },
      })),
      'Select a technology to research',
    );
  }

  /**
   * Directly acquire a specific tech without interaction.
   * Use when the tech ID is already known (e.g. from a card effect
   * that grants a specific tech).
   */
  public static acquireTech(
    player: IPlayer,
    game: IGame,
    techId: ETechId,
  ): IResearchTechResult {
    const techBoard = game.techBoard;
    if (techBoard === null) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Tech board is not available',
      );
    }

    if (!techBoard.canResearch(player.id, techId)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Cannot research this tech',
        { playerId: player.id, techId },
      );
    }

    const takeResult = techBoard.take(player.id, techId);
    player.techs.push(techId);
    player.score += takeResult.vpBonus;

    if (takeResult.tile.tech.onAcquire) {
      takeResult.tile.tech.onAcquire(player);
    }

    return {
      techId,
      vpBonus: takeResult.vpBonus,
    };
  }

  public static getFilteredTechs(
    player: IPlayer,
    game: IGame,
    filter?: TResearchTechFilter,
  ): ETechId[] {
    if (game.techBoard === null) return [];

    const allAvailable = game.techBoard.getAvailableTechs(player.id);

    if (!filter || filter.mode === 'all') {
      return allAvailable;
    }

    if (filter.mode === 'category') {
      const categorySet = new Set<ETech>(filter.categories as ETech[]);
      return allAvailable.filter((techId) => {
        const desc = getTechDescriptor(techId);
        return categorySet.has(desc.type as ETech);
      });
    }

    const idSet = new Set<ETechId>(filter.techIds);
    return allAvailable.filter((techId) => idSet.has(techId));
  }
}
