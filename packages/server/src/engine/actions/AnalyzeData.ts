import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import {
  AnalyzeDataEffect,
  type IAnalyzeDataResult,
} from '../effects/data/AnalyzeDataEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export type { IAnalyzeDataResult };

const ANALYZE_ENERGY_COST = 1;

export class AnalyzeDataAction {
  public static canExecute(player: IPlayer, _game: IGame): boolean {
    if (!player.resources.has({ energy: ANALYZE_ENERGY_COST })) {
      return false;
    }
    return AnalyzeDataEffect.canExecute(player);
  }

  public static execute(player: IPlayer, game: IGame): IAnalyzeDataResult {
    if (!this.canExecute(player, game)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'AnalyzeData action is not currently legal',
        { playerId: player.id },
      );
    }

    player.resources.spend({ energy: ANALYZE_ENERGY_COST });
    return AnalyzeDataEffect.execute(player);
  }
}
