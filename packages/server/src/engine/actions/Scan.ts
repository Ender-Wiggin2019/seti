import {
  SCAN_CREDIT_COST,
  SCAN_ENERGY_COST,
} from '@seti/common/constant/actionCosts';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { RefillCardRowEffect } from '../effects/cardRow/RefillCardRowEffect.js';
import type { IScanWithTechsResult } from '../effects/scan/ScanWithTechsEffect.js';
import { ScanWithTechsEffect } from '../effects/scan/ScanWithTechsEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IScanActionResult extends IScanWithTechsResult {
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
   * 2. Run ScanWithTechsEffect (base scan + optional tech activations)
   * 3. Refill card row after all scan substeps complete
   */
  public static execute(
    player: IPlayer,
    game: IGame,
    options: {
      earthSectorIndex?: number;
      mercurySectorIndex?: number;
    } = {},
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

    return ScanWithTechsEffect.execute(player, game, {
      earthSectorIndex: options.earthSectorIndex,
      mercurySectorIndex: options.mercurySectorIndex,
      onComplete: () => {
        RefillCardRowEffect.execute(game);
        return undefined;
      },
    });
  }
}
