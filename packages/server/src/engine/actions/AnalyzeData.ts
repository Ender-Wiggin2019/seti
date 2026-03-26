import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

const ANALYZE_ENERGY_COST = 1;

export interface IAnalyzeDataResult {
  dataCleared: number;
}

export class AnalyzeDataAction {
  public static canExecute(player: IPlayer, _game: IGame): boolean {
    if (!player.resources.has({ energy: ANALYZE_ENERGY_COST })) {
      return false;
    }
    return player.computer.isFull();
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

    const dataCleared = player.computer.getPlacedCount();
    player.computer.clear();

    return { dataCleared };
  }
}
