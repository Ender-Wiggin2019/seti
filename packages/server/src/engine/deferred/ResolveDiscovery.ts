import { createActionEvent } from '@/engine/event/GameEvent.js';
import type { IGame, IGamePlayerIdentity } from '@/engine/IGame.js';
import { DeferredAction, type PlayerInput } from './DeferredAction.js';
import { EPriority } from './Priority.js';

export class ResolveDiscovery extends DeferredAction {
  public constructor(
    player: IGamePlayerIdentity,
    priority: EPriority = EPriority.DISCOVERY,
  ) {
    super(player, priority);
  }

  public execute(game: IGame): PlayerInput | undefined {
    const markersUsed = game.milestoneState.getNeutralDiscoveryMarkersUsed();
    if (markersUsed >= 3) {
      game.eventLog.append(
        createActionEvent(this.player.id, 'DISCOVERY_CHECK_PENDING', {
          neutralMarkersUsed: markersUsed,
        }),
      );
    }
    return undefined;
  }
}
