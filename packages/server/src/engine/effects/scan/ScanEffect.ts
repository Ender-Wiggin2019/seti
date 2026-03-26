import type { ESector } from '@seti/common/types/element';
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

    const earthSectorIdx = options.earthSectorIndex ?? 0;
    result.earthSectorSignal = MarkSectorSignalEffect.markByIndex(
      player,
      game,
      earthSectorIdx,
    );

    if (game.cardRow.length === 0) {
      return options.onComplete?.(result);
    }

    return SelectCardFromCardRowEffect.execute(player, game, {
      destination: 'discard',
      onComplete: (cardInfo: ICardRowCardInfo) => {
        result.cardRowCard = cardInfo;

        const sectorColor = this.extractSectorColor(cardInfo.rawItem);
        if (sectorColor) {
          result.targetSectorSignal = MarkSectorSignalEffect.markByColor(
            player,
            game,
            sectorColor,
          );
        }

        return options.onComplete?.(result);
      },
    });
  }

  /**
   * Attempt to derive a sector color from a card row item.
   *
   * Supports `IBaseCard`-shaped objects with a `sector` field.
   * Returns `null` for bare string IDs (card system not yet wired).
   */
  private static extractSectorColor(cardItem: unknown): ESector | null {
    if (
      cardItem !== null &&
      typeof cardItem === 'object' &&
      'sector' in cardItem
    ) {
      return (cardItem as { sector: ESector }).sector;
    }
    return null;
  }
}
