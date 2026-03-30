import type { Sector } from '@/engine/board/Sector.js';
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
    return SectorFulfillmentEffect.checkAll(game, () => {
      const sectors = game.sectors as Sector[];
      for (const sector of sectors) {
        if (sector.sectorWinners.length > 0) {
          const latestWinner =
            sector.sectorWinners[sector.sectorWinners.length - 1];
          game.eventLog.append(
            createActionEvent(this.player.id, 'SECTOR_COMPLETION_RESOLVED', {
              sectorId: sector.id,
              winnerPlayerId: latestWinner,
            }),
          );
        }
      }
      return undefined;
    });
  }
}
