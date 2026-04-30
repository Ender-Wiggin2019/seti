import type { IGame, IGamePlayerIdentity } from '@/engine/IGame.js';
import type { PlayerInput } from '@/engine/input/PlayerInput.js';
import { EPriority } from './Priority.js';

export type { PlayerInput };

export abstract class DeferredAction {
  public readonly player: IGamePlayerIdentity;

  public readonly priority: EPriority;

  protected constructor(
    player: IGamePlayerIdentity,
    priority: EPriority = EPriority.DEFAULT,
  ) {
    this.player = player;
    this.priority = priority;
  }

  public abstract execute(game: IGame): PlayerInput | undefined;
}
