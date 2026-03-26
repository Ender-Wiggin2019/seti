import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

/**
 * CompleteMission free action — completes a QUICK_MISSION branch.
 *
 * FULL_MISSION triggers are handled automatically via the deferred action
 * pipeline (see MissionTracker.checkAndPromptTriggers). This free action
 * is specifically for QUICK_MISSIONs that the player wants to complete
 * when a state-based condition is met.
 */
export class CompleteMissionFreeAction {
  static canExecute(player: IPlayer, game: IGame): boolean {
    return game.missionTracker.hasCompletableQuickMissions(player, game);
  }

  static execute(
    player: IPlayer,
    game: IGame,
    cardId: string,
    branchIndex?: number,
  ): void {
    const completable = game.missionTracker.getCompletableQuickMissions(
      player,
      game,
    );

    const resolvedIndex = branchIndex ?? 0;
    const match = completable.find(
      (m) => m.cardId === cardId && m.branchIndex === resolvedIndex,
    );

    if (!match) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Mission ${cardId} branch ${resolvedIndex} is not completable`,
        { cardId, branchIndex: resolvedIndex },
      );
    }

    game.missionTracker.completeMissionBranch(
      player,
      game,
      cardId,
      resolvedIndex,
    );
  }
}
