import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';
import {
  type ICardRowCardInfo,
  SelectCardFromCardRowEffect,
} from '../cardRow/SelectCardFromCardRowEffect.js';
import {
  type IMarkSectorSignalResult,
  MarkSectorSignalEffect,
} from './MarkSectorSignalEffect.js';
import { extractSectorColorFromCardItem } from './ScanEffectUtils.js';

export interface IScanEffectResult {
  earthSectorSignal: IMarkSectorSignalResult | null;
  cardRowCard: ICardRowCardInfo | null;
  targetSectorSignal: IMarkSectorSignalResult | null;
}

export interface IScanEffectOptions {
  /** Index of the earth-adjacent sector (defaults to 0). */
  earthSectorIndex?: number;
  /**
   * Callback fired after the full scan sequence completes.
   * Receives the accumulated results from all sub-effects.
   */
  onComplete?: (result: IScanEffectResult) => IPlayerInput | undefined;
}

/**
 * Composed effect: execute a scan sequence without paying costs.
 *
 * 1. Mark a signal on the earth sector (synchronous)
 * 2. Player selects a card from the card row (interactive)
 * 3. The selected card is discarded
 * 4. Mark a signal on the sector matching the card's color (synchronous)
 *
 * Card row is **not** refilled — use `RefillCardRowEffect` after the action.
 * This allows cards to trigger scan without refilling.
 */
export class ScanEffect {
  public static execute(
    player: IPlayer,
    game: IGame,
    options: IScanEffectOptions = {},
  ): IPlayerInput | undefined {
    const result: IScanEffectResult = {
      earthSectorSignal: null,
      cardRowCard: null,
      targetSectorSignal: null,
    };

    const continueAfterEarthSignal = (
      earthSignal: IMarkSectorSignalResult | null,
    ): IPlayerInput | undefined => {
      result.earthSectorSignal = earthSignal;

      if (game.cardRow.length === 0) {
        return options.onComplete?.(result);
      }

      return SelectCardFromCardRowEffect.execute(player, game, {
        destination: 'discard',
        onComplete: (cardInfo: ICardRowCardInfo) => {
          result.cardRowCard = cardInfo;

          const sectorColor = extractSectorColorFromCardItem(cardInfo.rawItem);
          if (sectorColor) {
            return MarkSectorSignalEffect.markByColor(
              player,
              game,
              sectorColor,
              (markResult) => {
                result.targetSectorSignal = markResult;
                return options.onComplete?.(result);
              },
            );
          }

          return options.onComplete?.(result);
        },
      });
    };

    const earthSectorIdx = options.earthSectorIndex ?? 0;
    return MarkSectorSignalEffect.markByIndexWithAlternatives(
      player,
      game,
      earthSectorIdx,
      continueAfterEarthSignal,
    );
  }
}
