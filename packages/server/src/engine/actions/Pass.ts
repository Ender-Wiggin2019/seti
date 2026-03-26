import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

const HAND_LIMIT_AFTER_PASS = 4;

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
   * 1. Discarding hand down to 4
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

    if (player.hand.length > HAND_LIMIT_AFTER_PASS) {
      const discardIndexes = options.discardCardIndexes ?? [];
      const toDiscard =
        discardIndexes.length > 0
          ? discardIndexes
          : Array.from(
              { length: player.hand.length - HAND_LIMIT_AFTER_PASS },
              (_, i) => i,
            );

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
