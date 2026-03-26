import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

/**
 * CompleteMission free action.
 *
 * TODO: Full implementation requires the mission condition system.
 * Currently a stub that always returns false for canExecute.
 *
 * When implemented:
 * - Conditional missions can be completed as free action when condition is true
 * - Completed missions are flipped face-down (moved to completedMissions)
 * - Player receives mission completion reward
 */
export class CompleteMissionFreeAction {
  // TODO: implement when mission card condition evaluation is available
  static canExecute(_player: IPlayer, _game: IGame): boolean {
    return false;
  }

  // TODO: implement execute - evaluate condition, flip card, grant reward
  static execute(_player: IPlayer, _game: IGame, _cardId: string): void {
    throw new Error(
      'CompleteMission is not yet implemented (pending mission condition system)',
    );
  }
}
