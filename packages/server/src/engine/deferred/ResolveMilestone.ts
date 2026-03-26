import type { IGame, IGamePlayerIdentity } from '@/engine/IGame.js';
import { DeferredAction, type PlayerInput } from './DeferredAction.js';
import { EPriority } from './Priority.js';

export class ResolveMilestone extends DeferredAction {
  public constructor(
    player: IGamePlayerIdentity,
    priority: EPriority = EPriority.MILESTONE,
  ) {
    super(player, priority);
  }

  public execute(game: IGame): PlayerInput | undefined {
    const currentPlayer = game.players.find(
      (player) => player.id === this.player.id,
    );
    if (!currentPlayer) {
      return undefined;
    }
    return game.milestoneState.checkAndQueue(game, currentPlayer);
  }
}
