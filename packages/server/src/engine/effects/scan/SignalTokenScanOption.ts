import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';
import {
  type ICardRowCardInfo,
  SelectCardFromCardRowEffect,
} from '../cardRow/SelectCardFromCardRowEffect.js';
import { MarkSectorSignalEffect } from './MarkSectorSignalEffect.js';
import { extractSectorColorFromCardItem } from './ScanEffectUtils.js';

export const MAX_SIGNAL_TOKEN_SPENDS_PER_SCAN = 2;

export function getSpendableSignalTokenScanCount(
  player: IPlayer,
  game: IGame,
  signalTokensSpent: number,
): number {
  if (game.options?.spaceAgencyOptions?.newDeck !== true) {
    return 0;
  }
  if (game.cardRow.length === 0) {
    return 0;
  }

  const spendCapRemaining = Math.max(
    0,
    MAX_SIGNAL_TOKEN_SPENDS_PER_SCAN - signalTokensSpent,
  );
  return Math.min(player.resources.signalTokens, spendCapRemaining);
}

export function executeSignalTokenScanOption(
  player: IPlayer,
  game: IGame,
  onReturnToScanPool: () => IPlayerInput | undefined,
): IPlayerInput | undefined {
  player.resources.spend({ signalTokens: 1 });

  return SelectCardFromCardRowEffect.execute(player, game, {
    destination: 'discard',
    onComplete: (cardInfo: ICardRowCardInfo) => {
      const sectorColor = extractSectorColorFromCardItem(cardInfo.rawItem);
      if (!sectorColor) {
        return onReturnToScanPool();
      }
      return MarkSectorSignalEffect.markByColor(
        player,
        game,
        sectorColor,
        onReturnToScanPool,
      );
    },
  });
}
