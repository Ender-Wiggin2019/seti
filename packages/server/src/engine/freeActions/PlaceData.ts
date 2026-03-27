import type { IComputerSlotReward } from '@seti/common/types/computer';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import { EComputerRow } from '../player/Computer.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IPlaceDataResult {
  row: 'top' | 'bottom';
  index: number;
  reward?: IComputerSlotReward;
}

export class PlaceDataFreeAction {
  static canExecute(player: IPlayer, _game: IGame): boolean {
    if (player.dataPool.count <= 0) {
      return false;
    }

    const computer = player.computer;
    if (computer.getNextTopIndex() >= 0) {
      return true;
    }

    return computer.getAvailableBottomIndices().length > 0;
  }

  static execute(player: IPlayer, game: IGame): IPlaceDataResult {
    if (player.dataPool.count <= 0) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'No data in pool to place',
      );
    }

    const computer = player.computer;

    const nextTopIndex = computer.getNextTopIndex();
    if (nextTopIndex >= 0) {
      const reward = player.data.placeFromPoolToComputer({
        row: EComputerRow.TOP,
        index: nextTopIndex,
      });
      if (reward) this.applyReward(player, game, reward);
      return { row: 'top', index: nextTopIndex, reward: reward ?? undefined };
    }

    const availableBottom = computer.getAvailableBottomIndices();
    if (availableBottom.length > 0) {
      const nextBottomIndex = availableBottom[0];
      const reward = player.data.placeFromPoolToComputer({
        row: EComputerRow.BOTTOM,
        index: nextBottomIndex,
      });
      if (reward) this.applyReward(player, game, reward);
      return {
        row: 'bottom',
        index: nextBottomIndex,
        reward: reward ?? undefined,
      };
    }

    throw new GameError(
      EErrorCode.INVALID_ACTION,
      'Computer is full, no available slot',
    );
  }

  private static applyReward(
    player: IPlayer,
    game: IGame,
    reward: IComputerSlotReward,
  ): void {
    if (reward.vp) {
      player.score += reward.vp;
    }
    if (reward.credits) {
      player.resources.gain({ credits: reward.credits });
    }
    if (reward.energy) {
      player.resources.gain({ energy: reward.energy });
    }
    if (reward.publicity) {
      player.resources.gain({ publicity: reward.publicity });
    }
    if (reward.drawCard && reward.drawCard > 0) {
      const drawn = game.mainDeck.drawN(reward.drawCard);
      player.hand.push(...drawn);
    }
    if (reward.tuckIncome && reward.tuckIncome > 0) {
      // TODO: tuck income requires a deferred player choice (select card to tuck).
      // For now, this flag signals the caller that a tuck-income action is pending.
      // The actual deferred action will be implemented in the tuck-income pipeline.
    }
  }
}
