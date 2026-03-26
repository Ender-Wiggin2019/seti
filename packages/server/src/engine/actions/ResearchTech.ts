import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { ETechId } from '@seti/common/types/tech';
import { RESEARCH_PUBLICITY_COST } from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IResearchTechResult {
  techId: ETechId;
  vpBonus: number;
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
  ): boolean {
    if (game.techBoard === null) return false;

    if (
      !isCardEffect &&
      !player.resources.has({ publicity: RESEARCH_PUBLICITY_COST })
    ) {
      return false;
    }

    return game.techBoard.getAvailableTechs(player.id).length > 0;
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    techId: ETechId,
    isCardEffect = false,
  ): IResearchTechResult {
    if (!this.canExecute(player, game, isCardEffect)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'ResearchTech action is not currently legal',
        { playerId: player.id, techId },
      );
    }

    const techBoard = game.techBoard!;

    let rotatedDisc = -1;
    if (game.solarSystem !== null) {
      rotatedDisc = game.solarSystem.rotateNextDisc();
    }

    if (!isCardEffect) {
      player.resources.spend({ publicity: RESEARCH_PUBLICITY_COST });
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
      rotatedDisc,
    };
  }
}
