import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IConvertEnergyResult {
  energySpent: number;
  movementGained: number;
}

export class ConvertEnergyToMovementFreeAction {
  static canExecute(player: IPlayer, _game: IGame): boolean {
    return player.resources.energy > 0;
  }

  static execute(
    player: IPlayer,
    _game: IGame,
    amount: number,
  ): IConvertEnergyResult {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'Amount must be a positive integer',
        { amount },
      );
    }

    if (player.resources.energy < amount) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'Not enough energy',
        { required: amount, available: player.resources.energy },
      );
    }

    player.resources.spend({ energy: amount });
    player.gainMove(amount);

    return {
      energySpent: amount,
      movementGained: amount,
    };
  }
}
