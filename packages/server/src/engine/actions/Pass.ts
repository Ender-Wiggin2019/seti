/*
 * @Author: Ender-Wiggin
 * @Date: 2026-03-26 15:24:29
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2026-03-26 16:44:37
 * @Description:
 */
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IPassResult {
  discardedCards: unknown[];
  rotatedSolarSystem: boolean;
  rotatedDisc: number;
  endOfRoundCardSelected: boolean;
}

export class PassAction {
  public static canExecute(_player: IPlayer, _game: IGame): boolean {
    return true;
  }

  /**
   * Execute the pass sequence.
   * In the full implementation, this creates PlayerInputs for:
   * 1. Discarding hand down to `player.handLimitAfterPass`
   * 2. Selecting end-of-round card
   *
   * This simplified version takes pre-selected values.
   */
  public static execute(
    player: IPlayer,
    game: IGame,
    options: {
      discardCardIndexes?: number[];
      endOfRoundCardIndex?: number;
    } = {},
  ): IPassResult {
    const result: IPassResult = {
      discardedCards: [],
      rotatedSolarSystem: false,
      rotatedDisc: -1,
      endOfRoundCardSelected: false,
    };

    const handLimit = player.handLimitAfterPass;
    if (player.hand.length > handLimit) {
      const discardIndexes = options.discardCardIndexes ?? [];
      const toDiscard =
        discardIndexes.length > 0
          ? discardIndexes
          : Array.from({ length: player.hand.length - handLimit }, (_, i) => i);

      const sortedDesc = [...toDiscard].sort((a, b) => b - a);
      for (const idx of sortedDesc) {
        if (idx >= 0 && idx < player.hand.length) {
          const removed = player.hand.splice(idx, 1);
          result.discardedCards.push(...removed);
        }
      }
    }

    if (!game.hasRoundFirstPassOccurred) {
      game.hasRoundFirstPassOccurred = true;
      if (game.solarSystem !== null) {
        result.rotatedDisc = game.solarSystem.rotateNextDisc();
        result.rotatedSolarSystem = true;
      }
    }

    const stackIndex = game.roundRotationReminderIndex;
    if (stackIndex >= 0 && stackIndex < game.endOfRoundStacks.length) {
      const stack = game.endOfRoundStacks[stackIndex];
      if (stack.length > 0) {
        const cardIdx = options.endOfRoundCardIndex ?? 0;
        const validIdx = Math.min(Math.max(0, cardIdx), stack.length - 1);
        const selectedCard = stack.splice(validIdx, 1)[0];
        if (selectedCard !== undefined) {
          player.hand.push(selectedCard);
          result.endOfRoundCardSelected = true;
        }
      }
    }

    player.passed = true;

    return result;
  }
}
