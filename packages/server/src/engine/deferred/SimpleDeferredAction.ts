import type { IGame, IGamePlayerIdentity } from '@/engine/IGame.js';
import { DeferredAction, type PlayerInput } from './DeferredAction.js';
import { EPriority } from './Priority.js';

export class SimpleDeferredAction extends DeferredAction {
  private readonly callback: (game: IGame) => PlayerInput | undefined;

  public constructor(
    player: IGamePlayerIdentity,
    callback: (game: IGame) => PlayerInput | undefined,
    priority: EPriority = EPriority.DEFAULT,
  ) {
    super(player, priority);
    this.callback = callback;
  }

  public execute(game: IGame): PlayerInput | undefined {
    return this.callback(game);
  }
}
