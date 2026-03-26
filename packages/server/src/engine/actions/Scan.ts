import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { RefillCardRowEffect } from '../effects/cardRow/RefillCardRowEffect.js';
import {
  type IScanEffectResult,
  ScanEffect,
} from '../effects/scan/ScanEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';

const SCAN_CREDIT_COST = 1;
const SCAN_ENERGY_COST = 2;

export interface IScanActionResult extends IScanEffectResult {
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
   * 2. Run ScanEffect (mark earth sector → select & discard card → mark target sector)
   * 3. Refill card row after scan completes
   *
   * Returns a `PlayerInput` for the card row selection step.
   */
  public static execute(
    player: IPlayer,
    game: IGame,
    options: { earthSectorIndex?: number } = {},
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

    return ScanEffect.execute(player, game, {
      earthSectorIndex: options.earthSectorIndex,
      onComplete: (_scanResult) => {
        RefillCardRowEffect.execute(game);
        return undefined;
      },
    });
  }
}
