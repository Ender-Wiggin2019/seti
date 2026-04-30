import type { ESector } from '@seti/common/types/element';
import type { ETechId } from '@seti/common/types/tech';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';
import type { TPartialResourceBundle } from '../player/Resources.js';

export interface ICardRequirements {
  resources?: TPartialResourceBundle;
  requiredTechIds?: ETechId[];
  minScore?: number;
  requiredSectorColors?: ESector[];
  custom?: (player: IPlayer, game: IGame) => boolean;
}

export class Requirements {
  public static checkRequirements(
    player: IPlayer,
    game: IGame,
    requirements: ICardRequirements,
  ): boolean {
    if (
      requirements.resources &&
      !player.resources.has(requirements.resources)
    ) {
      return false;
    }
    if (
      requirements.requiredTechIds &&
      requirements.requiredTechIds.some(
        (techId) => !player.techs.includes(techId),
      )
    ) {
      return false;
    }
    if (
      requirements.minScore !== undefined &&
      player.score < requirements.minScore
    ) {
      return false;
    }
    if (
      requirements.requiredSectorColors &&
      !this.areRequiredSectorsPresent(game, requirements.requiredSectorColors)
    ) {
      return false;
    }
    if (requirements.custom && !requirements.custom(player, game)) {
      return false;
    }
    return true;
  }

  private static areRequiredSectorsPresent(
    game: IGame,
    requiredSectorColors: ESector[],
  ): boolean {
    const allSectors = game.sectors as Array<{ color?: ESector }>;
    return requiredSectorColors.every((requiredColor) =>
      allSectors.some((sector) => sector.color === requiredColor),
    );
  }
}
