import type { ESector } from '@seti/common/types/element';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { findSectorByColor, getSectorAt } from './ScanEffectUtils.js';

export interface IMarkSectorSignalResult {
  sectorId: string;
  dataGained: boolean;
  vpGained: number;
  completed: boolean;
}

/**
 * Atomic effect: mark a signal on a sector for a player.
 *
 * This is the lowest-level scan operation — cards, actions, and composed
 * effects all funnel through here.  It never requires player interaction
 * and never pays costs.
 */
export class MarkSectorSignalEffect {
  public static markOnSector(
    player: IPlayer,
    sector: {
      markSignal(playerId: string): { dataGained: unknown; vpGained: number };
      id: string;
      completed: boolean;
    },
  ): IMarkSectorSignalResult {
    const signalResult = sector.markSignal(player.id);
    if (signalResult.dataGained !== null) {
      player.resources.gain({ data: 1 });
    }
    player.score += signalResult.vpGained;

    return {
      sectorId: sector.id,
      dataGained: signalResult.dataGained !== null,
      vpGained: signalResult.vpGained,
      completed: sector.completed,
    };
  }

  public static markByIndex(
    player: IPlayer,
    game: IGame,
    sectorIndex: number,
  ): IMarkSectorSignalResult | null {
    const sector = getSectorAt(game, sectorIndex);
    if (!sector) return null;
    return this.markOnSector(player, sector);
  }

  public static markByColor(
    player: IPlayer,
    game: IGame,
    color: ESector,
  ): IMarkSectorSignalResult | null {
    const sector = findSectorByColor(game, color);
    if (!sector) return null;
    return this.markOnSector(player, sector);
  }
}
