import type { Sector } from '@/engine/board/Sector.js';
import { createActionEvent } from '@/engine/event/GameEvent.js';
import type { IGame, IGamePlayerIdentity } from '@/engine/IGame.js';
import { DeferredAction, type PlayerInput } from './DeferredAction.js';
import { EPriority } from './Priority.js';

export class ResolveSectorCompletion extends DeferredAction {
  public constructor(
    player: IGamePlayerIdentity,
    priority: EPriority = EPriority.SECTOR_COMPLETION,
  ) {
    super(player, priority);
  }

  public execute(game: IGame): PlayerInput | undefined {
    const sectors = game.sectors as Sector[];
    for (const sector of sectors) {
      if (!sector.completed) {
        continue;
      }
      const result = sector.resolveCompletion();
      for (const participantId of result.participants) {
        const participant = game.players.find((p) => p.id === participantId);
        if (participant) {
          participant.publicity += result.publicityGains[participantId] ?? 0;
        }
      }
      if (result.winnerPlayerId) {
        const winner = game.players.find((p) => p.id === result.winnerPlayerId);
        if (winner) {
          winner.score += result.winnerReward;
        }
      }

      game.eventLog.append(
        createActionEvent(this.player.id, 'SECTOR_COMPLETION_RESOLVED', {
          sectorId: sector.id,
          winnerPlayerId: result.winnerPlayerId,
          secondPlacePlayerId: result.secondPlacePlayerId,
          winnerReward: result.winnerReward,
          participants: result.participants,
        }),
      );
    }

    return undefined;
  }
}
