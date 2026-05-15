import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import {
  type ICardRowCardInfo,
  SelectCardFromCardRowEffect,
} from '../effects/cardRow/SelectCardFromCardRowEffect.js';
import { MarkSectorSignalEffect } from '../effects/scan/MarkSectorSignalEffect.js';
import {
  getScanSignalTokenSpendCount,
  isScanActionPoolInput,
  recordScanSignalTokenSpend,
  refreshScanActionPoolInput,
} from '../effects/scan/ScanActionPool.js';
import { extractSectorColorFromCardItem } from '../effects/scan/ScanEffectUtils.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';

export class SpendSignalTokenFreeAction {
  private static readonly MAX_SPENDS_PER_SCAN = 2;

  public static canExecute(player: IPlayer, game: IGame): boolean {
    return (
      game.options.spaceAgencyOptions?.newDeck === true &&
      isScanActionPoolInput(player.waitingFor) &&
      getScanSignalTokenSpendCount(player.waitingFor) <
        SpendSignalTokenFreeAction.MAX_SPENDS_PER_SCAN &&
      player.resources.signalTokens > 0 &&
      game.cardRow.length > 0
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

    player.resources.spend({ signalTokens: 1 });
    recordScanSignalTokenSpend(returnToScanPool);

    return SelectCardFromCardRowEffect.execute(player, game, {
      destination: 'discard',
      onComplete: (cardInfo: ICardRowCardInfo) => {
        const sectorColor = extractSectorColorFromCardItem(cardInfo.rawItem);
        if (!sectorColor) {
          return refreshScanActionPoolInput(returnToScanPool);
        }
        return MarkSectorSignalEffect.markByColor(
          player,
          game,
          sectorColor,
          () => refreshScanActionPoolInput(returnToScanPool),
        );
      },
    });
  }
}
