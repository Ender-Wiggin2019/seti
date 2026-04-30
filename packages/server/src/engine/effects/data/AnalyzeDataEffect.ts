import type { IPlayer } from '../../player/IPlayer.js';

export interface IAnalyzeDataResult {
  dataCleared: number;
}

/**
 * Atomic effect: clear all placed data from the player's computer.
 *
 * Only clears the computer slots — the data pool is left untouched.
 * Non-interactive, no costs.
 */
export class AnalyzeDataEffect {
  public static canExecute(player: IPlayer): boolean {
    return player.computer.isConnected();
  }

  public static execute(player: IPlayer): IAnalyzeDataResult {
    const dataCleared = player.computer.getPlacedCount();
    player.computer.clear();
    return { dataCleared };
  }
}
