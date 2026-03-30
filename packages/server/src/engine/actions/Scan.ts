import {
  SCAN_CREDIT_COST,
  SCAN_ENERGY_COST,
} from '@seti/common/constant/actionCosts';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { RefillCardRowEffect } from '../effects/cardRow/RefillCardRowEffect.js';
import type { IScanActionPoolResult } from '../effects/scan/ScanActionPool.js';
import { ScanActionPool } from '../effects/scan/ScanActionPool.js';
import { SectorFulfillmentEffect } from '../effects/scan/SectorFulfillmentEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IScanActionResult extends IScanActionPoolResult {
  refillCount: number;
}

export class ScanAction {
  public static canExecute(player: IPlayer, _game: IGame): boolean {
    return player.resources.has({
      credits: SCAN_CREDIT_COST,
      energy: SCAN_ENERGY_COST,
    });
  }

  /**
   * Execute the scan standard action.
   *
   * 1. Pay costs
   * 2. Enter scan action pool (free-order sub-actions)
   * 3. Check sector fulfillment (resolve any completed sectors)
   * 4. Refill card row
   */
  public static execute(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
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

    return ScanActionPool.execute(player, game, {
      onComplete: () =>
        SectorFulfillmentEffect.checkAll(game, () => {
          RefillCardRowEffect.execute(game);
          return undefined;
        }),
    });
  }
}
