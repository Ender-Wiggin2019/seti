import type { ESector } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { Sector } from '../board/Sector.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

const SCAN_CREDIT_COST = 1;
const SCAN_ENERGY_COST = 2;

export interface IScanSignalResult {
  sectorId: string;
  dataGained: boolean;
  vpGained: number;
}

export interface IScanResult {
  earthSectorSignal: IScanSignalResult | null;
  cardRowSectorSignal: IScanSignalResult | null;
  completedSectors: string[];
}

export class ScanAction {
  public static canExecute(player: IPlayer, _game: IGame): boolean {
    return player.resources.has({
      credits: SCAN_CREDIT_COST,
      energy: SCAN_ENERGY_COST,
    });
  }

  /**
   * Execute scan with pre-selected parameters.
   *
   * @param earthSectorIndex - index into game.sectors for the Earth-adjacent sector
   * @param cardRowDiscardIndex - which card-row card to discard
   * @param targetSectorColor - which sector color the discarded card maps to
   */
  public static execute(
    player: IPlayer,
    game: IGame,
    options: {
      earthSectorIndex?: number;
      cardRowDiscardIndex: number;
      targetSectorColor: ESector;
    },
  ): IScanResult {
    if (!this.canExecute(player, game)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Scan action is not currently legal',
        { playerId: player.id },
      );
    }

    player.resources.spend({
      credits: SCAN_CREDIT_COST,
      energy: SCAN_ENERGY_COST,
    });

    const result: IScanResult = {
      earthSectorSignal: null,
      cardRowSectorSignal: null,
      completedSectors: [],
    };

    const earthSectorIdx = options.earthSectorIndex ?? 0;
    const earthSector = this.getSectorAt(game, earthSectorIdx);
    if (earthSector) {
      result.earthSectorSignal = this.markSectorSignal(
        player,
        earthSector,
        result.completedSectors,
      );
    }

    if (
      options.cardRowDiscardIndex >= 0 &&
      options.cardRowDiscardIndex < game.cardRow.length
    ) {
      game.cardRow.splice(options.cardRowDiscardIndex, 1);
      const refillCard = game.mainDeck.draw();
      if (refillCard !== undefined) {
        game.cardRow.push(refillCard);
      }

      const targetSector = this.findSectorByColor(
        game,
        options.targetSectorColor,
      );
      if (targetSector) {
        result.cardRowSectorSignal = this.markSectorSignal(
          player,
          targetSector,
          result.completedSectors,
        );
      }
    }

    return result;
  }

  private static markSectorSignal(
    player: IPlayer,
    sector: Sector,
    completedSectors: string[],
  ): IScanSignalResult {
    const signalResult = sector.markSignal(player.id);
    if (signalResult.dataGained !== null) {
      player.resources.gain({ data: 1 });
    }
    player.score += signalResult.vpGained;
    if (sector.completed) {
      completedSectors.push(sector.id);
    }
    return {
      sectorId: sector.id,
      dataGained: signalResult.dataGained !== null,
      vpGained: signalResult.vpGained,
    };
  }

  private static getSectorAt(game: IGame, index: number): Sector | null {
    const s = game.sectors[index];
    if (s && typeof s === 'object' && 'markSignal' in s) {
      return s as Sector;
    }
    return null;
  }

  private static findSectorByColor(game: IGame, color: ESector): Sector | null {
    const sector = game.sectors.find(
      (s) =>
        s &&
        typeof s === 'object' &&
        'color' in s &&
        (s as Sector).color === color,
    );
    return (sector as Sector) ?? null;
  }
}
