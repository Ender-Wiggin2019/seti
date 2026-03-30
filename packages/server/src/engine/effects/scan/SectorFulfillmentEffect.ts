import type {
  TSectorWinnerBonus,
  TSectorWinnerBonusItem,
} from '@seti/common/constant/sectorSetup';
import { ETrace } from '@seti/common/types/element';
import type { ISectorCompletionResult, Sector } from '../../board/Sector.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';

export interface ISectorFulfillmentResult {
  sectorId: string;
  completion: ISectorCompletionResult;
}

/**
 * Check all sectors for fulfillment after a mark-signal action completes
 * (e.g., at the end of a full Scan action).
 *
 * For each fulfilled sector, resolves winner, awards bonuses, and resets
 * the sector with the second-place marker.
 */
export class SectorFulfillmentEffect {
  /**
   * Check all game sectors. Resolves fulfilled ones in order (index 0..7).
   * Each resolution may produce `IPlayerInput` if the bonus is interactive.
   * After all sectors are resolved, calls `onComplete`.
   */
  public static checkAll(
    game: IGame,
    onComplete?: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    const fulfilled = game.sectors.filter((s) => s.isFulfilled());
    return this.resolveChain(fulfilled, game, onComplete);
  }

  private static resolveChain(
    sectors: Sector[],
    game: IGame,
    onComplete?: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    if (sectors.length === 0) {
      return onComplete?.();
    }

    const [sector, ...rest] = sectors;
    return this.resolveSector(sector, game, () =>
      this.resolveChain(rest, game, onComplete),
    );
  }

  private static resolveSector(
    sector: Sector,
    game: IGame,
    onDone: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    const result = sector.resolveCompletion();

    for (const playerId of result.participants) {
      const player = game.players.find((p) => p.id === playerId);
      if (player) {
        player.resources.gain({ publicity: 1 });
      }
    }

    if (result.winnerPlayerId) {
      const winner = game.players.find((p) => p.id === result.winnerPlayerId);
      if (winner) {
        const bonus = result.isFirstWin
          ? sector.firstWinBonus
          : sector.repeatWinBonus;
        return this.applyWinnerBonuses(winner, bonus, onDone);
      }
    }

    return onDone();
  }

  /**
   * Apply all bonus items in a compound bonus sequentially.
   * Synchronous items (trace, vp) are applied immediately.
   */
  private static applyWinnerBonuses(
    player: IPlayer,
    bonus: TSectorWinnerBonus,
    onDone: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    for (const item of bonus) {
      this.applyBonusItem(player, item);
    }
    return onDone();
  }

  private static applyBonusItem(
    player: IPlayer,
    item: TSectorWinnerBonusItem,
  ): void {
    switch (item.type) {
      case 'trace':
        this.addTrace(player, item.trace);
        break;
      case 'vp':
        player.score += item.amount;
        break;
    }
  }

  private static addTrace(player: IPlayer, trace: ETrace): void {
    player.traces[trace] = (player.traces[trace] ?? 0) + 1;
  }
}
