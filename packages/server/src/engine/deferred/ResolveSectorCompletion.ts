import { createActionEvent } from '@/engine/event/GameEvent.js';
import type { IGame, IGamePlayerIdentity } from '@/engine/IGame.js';
import { SectorFulfillmentEffect } from '../effects/scan/SectorFulfillmentEffect.js';
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
    const turnOwner = game.players.find(
      (candidate) => candidate.id === this.player.id,
    );
    return SectorFulfillmentEffect.checkAll(
      game,
      undefined,
      turnOwner,
      (sectorId) => {
        const sector = game.sectors.find((s) => s.id === sectorId);
        const latestWinner = sector?.sectorWinners.at(-1);
        if (!latestWinner) return;
        game.eventLog.append(
          createActionEvent(this.player.id, 'SECTOR_COMPLETION_RESOLVED', {
            sectorId,
            winnerPlayerId: latestWinner,
          }),
        );
      },
    );
  }
}
