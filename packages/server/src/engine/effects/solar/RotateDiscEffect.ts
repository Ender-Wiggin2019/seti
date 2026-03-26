import type { IGame } from '../../IGame.js';

export interface IRotateDiscResult {
  rotatedDisc: number;
}

/**
 * Atomic effect: rotate the next disc on the solar system board.
 *
 * Returns the index of the disc that was rotated, or -1 if the
 * solar system is not present.
 * Non-interactive, no costs.
 */
export class RotateDiscEffect {
  public static canExecute(game: IGame): boolean {
    return game.solarSystem !== null;
  }

  public static execute(game: IGame): IRotateDiscResult {
    if (game.solarSystem === null) {
      return { rotatedDisc: -1 };
    }
    return { rotatedDisc: game.solarSystem.rotateNextDisc() };
  }
}
