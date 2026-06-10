import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import {
  getScanSignalTokenSpendCount,
  isScanActionPoolInput,
  recordScanSignalTokenSpend,
  refreshScanActionPoolInput,
} from '../effects/scan/ScanActionPool.js';
import {
  executeSignalTokenScanOption,
  getSpendableSignalTokenScanCount,
} from '../effects/scan/SignalTokenScanOption.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';

export class SpendSignalTokenFreeAction {
  public static canExecute(player: IPlayer, game: IGame): boolean {
    return (
      isScanActionPoolInput(player.waitingFor) &&
      getSpendableSignalTokenScanCount(
        player,
        game,
        getScanSignalTokenSpendCount(player.waitingFor),
      ) > 0
    );
  }

  public static execute(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    const returnToScanPool = player.waitingFor;
    if (!this.canExecute(player, game) || !returnToScanPool) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Spend signal token is not currently legal',
        {
          inScanPool: isScanActionPoolInput(player.waitingFor),
          signalTokens: player.resources.signalTokens,
          cardRowCount: game.cardRow.length,
          signalTokensSpent: getScanSignalTokenSpendCount(player.waitingFor),
        },
      );
    }

    recordScanSignalTokenSpend(returnToScanPool);
    return executeSignalTokenScanOption(player, game, () =>
      refreshScanActionPoolInput(returnToScanPool),
    );
  }
}
