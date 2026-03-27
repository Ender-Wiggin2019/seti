import type { AlienBoard } from '@/engine/alien/AlienBoard.js';
import { createActionEvent } from '@/engine/event/GameEvent.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { DeferredAction, type PlayerInput } from './DeferredAction.js';
import { EPriority } from './Priority.js';

export class ResolveDiscovery extends DeferredAction {
  public constructor(
    player: IPlayer,
    priority: EPriority = EPriority.DISCOVERY,
  ) {
    super(player, priority);
  }

  public execute(game: IGame): PlayerInput | undefined {
    const discoverable = game.alienState.getNewlyDiscoverableAliens();
    if (discoverable.length === 0) {
      return undefined;
    }

    return this.resolveChain(game, discoverable, 0);
  }

  private resolveChain(
    game: IGame,
    boards: AlienBoard[],
    index: number,
  ): PlayerInput | undefined {
    if (index >= boards.length) {
      return undefined;
    }

    const board = boards[index];
    game.eventLog.append(
      createActionEvent(this.player.id, 'ALIEN_DISCOVERED', {
        alienType: board.alienType,
        alienIndex: board.alienIndex,
      }),
    );

    const pluginInput = game.alienState.discoverAlien(board, game);
    if (pluginInput !== undefined) {
      return pluginInput;
    }

    return this.resolveChain(game, boards, index + 1);
  }
}
