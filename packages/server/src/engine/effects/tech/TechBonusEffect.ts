import { ETechBonusType, type ITechBonusToken } from '@seti/common/types/tech';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { AnyCardChoiceEffect } from '../card/AnyCardChoiceEffect.js';
import { LaunchProbeEffect } from '../probe/LaunchProbeEffect.js';

export interface ITechBonusResult {
  bonus: ITechBonusToken;
  applied: boolean;
}

/**
 * Resolves a one-time bonus token from an acquired tech tile.
 */
export class TechBonusEffect {
  public static createAnyCardChoice(
    player: IPlayer,
    game: IGame,
    onComplete?: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    return AnyCardChoiceEffect.execute(player, game, 1, onComplete);
  }

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
        throw new Error(
          'Tech bonus CARD requires createAnyCardChoice for card row/deck selection.',
        );

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
        if (
          !LaunchProbeEffect.canExecute(player, game, { ignoreLimit: true })
        ) {
          return { bonus, applied: false };
        }
        LaunchProbeEffect.execute(player, game, { ignoreLimit: true });
        break;
    }
    return { bonus, applied: true };
  }
}
