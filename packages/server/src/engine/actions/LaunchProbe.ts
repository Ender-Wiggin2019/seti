import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import {
  type ILaunchProbeEffectResult,
  LaunchProbeEffect,
} from '../effects/probe/LaunchProbeEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

const LAUNCH_PROBE_CREDIT_COST = 2;

export type ILaunchProbeResult = ILaunchProbeEffectResult;

export class LaunchProbeAction {
  public static canExecute(player: IPlayer, game: IGame): boolean {
    if (!player.resources.has({ credits: LAUNCH_PROBE_CREDIT_COST })) {
      return false;
    }
    return LaunchProbeEffect.canExecute(player, game);
  }

  public static execute(player: IPlayer, game: IGame): ILaunchProbeResult {
    if (!this.canExecute(player, game)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'LaunchProbe action is not currently legal',
        { playerId: player.id },
      );
    }

    player.resources.spend({ credits: LAUNCH_PROBE_CREDIT_COST });
    return LaunchProbeEffect.execute(player, game);
  }
}
