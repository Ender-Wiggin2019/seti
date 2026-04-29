import { ESector } from '@seti/common/types/element';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export function countSectorFulfills(
  player: IPlayer,
  game: IGame,
  color?: ESector,
): number {
  return game.sectors.reduce((total, sectorLike) => {
    const sector = sectorLike as {
      color?: ESector;
      sectorWinners?: string[];
    };

    if (color && sector.color !== color) {
      return total;
    }

    return (
      total +
      (sector.sectorWinners?.filter((id) => id === player.id).length ?? 0)
    );
  }, 0);
}
