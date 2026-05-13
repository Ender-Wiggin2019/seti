import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';

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
    const players = getPlayers(game);
    const publicityBefore = new Map(
      players.map((player) => [
        player.id,
        game.solarSystem?.getPlayerPublicity(player.id) ?? 0,
      ]),
    );
    const rotatedDisc = game.solarSystem.rotateNextDisc();
    for (const player of players) {
      const before = publicityBefore.get(player.id) ?? 0;
      const after = game.solarSystem.getPlayerPublicity(player.id);
      const gained = after - before;
      if (gained > 0) {
        player.resources.gain({ publicity: gained });
      }
    }
    game.alienState?.onSolarSystemRotated(game);
    return { rotatedDisc };
  }
}

function getPlayers(game: IGame): ReadonlyArray<IPlayer> {
  const maybePlayers = (game as { players?: unknown }).players;
  return Array.isArray(maybePlayers)
    ? (maybePlayers as ReadonlyArray<IPlayer>)
    : [];
}
