import type { Game } from '@/engine/Game.js';
import { RivalResourceResolver } from './RivalResourceResolver.js';
import { RivalSetup } from './RivalSetup.js';

const OBJECTIVE_PENALTY_PROGRESS = 3;
const OBJECTIVE_END_GAME_VP = 5;

export class RivalRoundController {
  public static applyBetweenRoundObjectivePayment(game: Game): void {
    const rivalState = game.rivalState;
    if (!rivalState || rivalState.difficulty === 1 || game.round > 4) {
      return;
    }

    const requiredObjectives = game.round;
    const paidObjectives = Math.min(
      rivalState.completedObjectiveIds.length,
      requiredObjectives,
    );
    rivalState.completedObjectiveIds.splice(0, paidObjectives);

    const missingObjectives = requiredObjectives - paidObjectives;
    if (missingObjectives > 0) {
      RivalResourceResolver.gainProgress(
        game,
        missingObjectives * OBJECTIVE_PENALTY_PROGRESS,
      );
    }
  }

  public static resetActionDeckForNextRound(game: Game): void {
    const rivalState = game.rivalState;
    if (!rivalState) {
      return;
    }

    rivalState.actionDeck.reshuffleDiscards(game.random);
    rivalState.usedActionCardIdsThisRound = [];
    rivalState.currentActionCardId = null;
  }

  public static applyEndGameObjectiveVp(game: Game): void {
    const rivalState = game.rivalState;
    if (!rivalState || rivalState.difficulty === 1) {
      return;
    }

    const rival = RivalSetup.getRivalPlayer(game);
    const uncompletedObjectives =
      rivalState.revealedObjectiveIds.length +
      rivalState.objectiveDrawPile.length;
    rival.score += uncompletedObjectives * OBJECTIVE_END_GAME_VP;
  }
}
