import type { IInputResponse } from '@seti/common/types/protocol/actions';
import type { IPlayerInputModel } from '@seti/common/types/protocol/playerInput';
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
      return this.wrapDiscoveryInput(game, boards, index + 1, pluginInput);
    }

    return this.resolveChain(game, boards, index + 1);
  }

  private wrapDiscoveryInput(
    game: IGame,
    boards: AlienBoard[],
    nextIndex: number,
    input: PlayerInput,
  ): PlayerInput {
    return new ContinueDiscoveryAfterInput(
      input,
      () => this.resolveChain(game, boards, nextIndex),
      (nextInput) =>
        this.wrapDiscoveryInput(game, boards, nextIndex, nextInput),
    );
  }
}

class ContinueDiscoveryAfterInput implements PlayerInput {
  public constructor(
    private readonly inner: PlayerInput,
    private readonly onComplete: () => PlayerInput | undefined,
    private readonly wrapNext: (input: PlayerInput) => PlayerInput,
  ) {}

  public get inputId(): string {
    return this.inner.inputId;
  }

  public get type(): PlayerInput['type'] {
    return this.inner.type;
  }

  public get player(): PlayerInput['player'] {
    return this.inner.player;
  }

  public get title(): string | undefined {
    return this.inner.title;
  }

  public toModel(): IPlayerInputModel {
    return this.inner.toModel();
  }

  public process(response: IInputResponse): PlayerInput | undefined {
    const nextInput = this.inner.process(response);
    if (nextInput !== undefined) {
      return this.wrapNext(nextInput);
    }
    return this.onComplete();
  }
}
