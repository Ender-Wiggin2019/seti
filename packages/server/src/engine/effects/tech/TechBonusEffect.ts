import { ETechBonusType, type ITechBonusToken } from '@seti/common/types/tech';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';

export interface ITechBonusResult {
  bonus: ITechBonusToken;
  applied: boolean;
}

/**
 * Resolves a one-time bonus token from an acquired tech tile.
 *
 * Pure side-effect on player/game state; never returns a PlayerInput
 * because all bonuses are non-interactive.
 */
export class TechBonusEffect {
  public static apply(
    player: IPlayer,
    game: IGame,
    bonus: ITechBonusToken,
  ): ITechBonusResult {
    switch (bonus.type) {
      case ETechBonusType.ENERGY:
        player.resources.gain({ energy: 1 });
        break;

      case ETechBonusType.DATA:
        player.resources.gain({ data: 1 });
        break;

      case ETechBonusType.DATA_2:
        player.resources.gain({ data: 2 });
        break;

      case ETechBonusType.PUBLICITY:
        player.resources.gain({ publicity: 1 });
        break;

      case ETechBonusType.CARD:
        this.drawCards(player, game, 1);
        break;

      case ETechBonusType.CREDIT:
        player.resources.gain({ credits: 1 });
        break;

      case ETechBonusType.VP_2:
        player.score += 2;
        break;

      case ETechBonusType.VP_3:
        player.score += 3;
        break;

      case ETechBonusType.LAUNCH_IGNORE_LIMIT:
        player.probeSpaceLimit += 1;
        break;
    }
    return { bonus, applied: true };
  }

  private static drawCards(player: IPlayer, game: IGame, count: number): void {
    const drawn = game.mainDeck.drawN(count);
    player.hand.push(...drawn);
    if (drawn.length > 0) {
      game.lockCurrentTurn();
    }
  }
}
