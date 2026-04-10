import type { IComputerSlotReward } from '@seti/common/types/computer';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { TuckCardForIncomeEffect } from '../effects/income/TuckCardForIncomeEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import { EComputerRow } from '../player/Computer.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IPlaceDataResult {
  row: 'top' | 'bottom';
  index: number;
  reward?: IComputerSlotReward;
  pendingInput?: IPlayerInput;
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

  static execute(
    player: IPlayer,
    game: IGame,
    slotIndex?: number,
  ): IPlaceDataResult {
    if (player.dataPool.count <= 0) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'No data in pool to place',
      );
    }

    const computer = player.computer;

    const nextTopIndex = computer.getNextTopIndex();
    if (nextTopIndex >= 0) {
      if (slotIndex !== undefined && slotIndex !== nextTopIndex) {
        throw new GameError(
          EErrorCode.INVALID_ACTION,
          `Top row must be filled left-to-right. Next available top slot is ${nextTopIndex}`,
          { requested: slotIndex, expected: nextTopIndex },
        );
      }
      const reward = player.data.placeFromPoolToComputer({
        row: EComputerRow.TOP,
        index: nextTopIndex,
      });
      const pendingInput = reward
        ? this.applyReward(player, game, reward)
        : undefined;
      return {
        row: 'top',
        index: nextTopIndex,
        reward: reward ?? undefined,
        pendingInput,
      };
    }

    const availableBottom = computer.getAvailableBottomIndices();
    if (availableBottom.length > 0) {
      const nextBottomIndex =
        slotIndex !== undefined ? slotIndex : availableBottom[0];
      if (!availableBottom.includes(nextBottomIndex)) {
        throw new GameError(
          EErrorCode.INVALID_ACTION,
          `Bottom slot ${nextBottomIndex} is not available`,
          { requested: nextBottomIndex, available: availableBottom },
        );
      }
      const reward = player.data.placeFromPoolToComputer({
        row: EComputerRow.BOTTOM,
        index: nextBottomIndex,
      });
      const pendingInput = reward
        ? this.applyReward(player, game, reward)
        : undefined;
      return {
        row: 'bottom',
        index: nextBottomIndex,
        reward: reward ?? undefined,
        pendingInput,
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
  ): IPlayerInput | undefined {
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
      return TuckCardForIncomeEffect.execute(player, game);
    }
    return undefined;
  }
}
