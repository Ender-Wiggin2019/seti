import { ETech } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { type ETechId, getTechDescriptor } from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import { EComputerRow } from '../player/Computer.js';
import type { IPlayer } from '../player/IPlayer.js';
import type { IComputerSlotReward } from '../tech/ITech.js';
import { TechModifierQuery } from '../tech/TechModifierQuery.js';

export interface IPlaceDataResult {
  row: 'top' | 'bottom';
  index: number;
  reward?: IComputerSlotReward;
}

function getPlayerComputerTechLevels(techs: ETechId[]): Set<number> {
  const levels = new Set<number>();
  for (const id of techs) {
    const desc = getTechDescriptor(id);
    if (desc.type === ETech.COMPUTER) {
      levels.add(desc.level);
    }
  }
  return levels;
}

function getComputerTechIdForLevel(
  techs: ETechId[],
  level: number,
): ETechId | undefined {
  return techs.find((id) => {
    const desc = getTechDescriptor(id);
    return desc.type === ETech.COMPUTER && desc.level === level;
  });
}

export class PlaceDataFreeAction {
  static canExecute(player: IPlayer, _game: IGame): boolean {
    if (player.dataPool.count <= 0) {
      return false;
    }

    const topSlots = player.computer.getTopSlots();
    const nextTopIndex = topSlots.findIndex((filled) => !filled);
    if (nextTopIndex >= 0) {
      return true;
    }

    const bottomSlots = player.computer.getBottomSlots();
    const unlockedLevels = getPlayerComputerTechLevels(player.techs);
    return bottomSlots.some(
      (filled, i) => !filled && topSlots[i] && unlockedLevels.has(i),
    );
  }

  static execute(player: IPlayer, game: IGame): IPlaceDataResult {
    if (player.dataPool.count <= 0) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'No data in pool to place',
      );
    }

    const topSlots = player.computer.getTopSlots();
    const nextTopIndex = topSlots.findIndex((filled) => !filled);
    if (nextTopIndex >= 0) {
      player.data.placeFromPoolToComputer({
        row: EComputerRow.TOP,
        index: nextTopIndex,
      });
      const reward = this.resolveReward(player, game, 'top', nextTopIndex);
      return { row: 'top', index: nextTopIndex, reward: reward ?? undefined };
    }

    const bottomSlots = player.computer.getBottomSlots();
    const unlockedLevels = getPlayerComputerTechLevels(player.techs);
    const nextBottomIndex = bottomSlots.findIndex(
      (filled, i) => !filled && topSlots[i] && unlockedLevels.has(i),
    );
    if (nextBottomIndex >= 0) {
      player.data.placeFromPoolToComputer({
        row: EComputerRow.BOTTOM,
        index: nextBottomIndex,
      });
      const reward = this.resolveReward(
        player,
        game,
        'bottom',
        nextBottomIndex,
      );
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

  private static resolveReward(
    player: IPlayer,
    game: IGame,
    row: 'top' | 'bottom',
    columnIndex: number,
  ): IComputerSlotReward | null {
    const techId = getComputerTechIdForLevel(player.techs, columnIndex);
    if (!techId) {
      return null;
    }

    const slotIndex = row === 'top' ? 0 : 1;
    const techQuery = TechModifierQuery.fromTechIds(player.techs);
    const reward = techQuery.getComputerSlotReward(techId, slotIndex);
    if (!reward) {
      return null;
    }

    this.applyReward(player, game, reward);
    return reward;
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
  }
}
