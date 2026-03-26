import type { IGame } from '@/engine/IGame.js';
import { DeferredAction, type PlayerInput } from './DeferredAction.js';

export class DeferredActionsQueue {
  private readonly actions: DeferredAction[] = [];

  public push(action: DeferredAction): void {
    const insertIndex = this.actions.findIndex(
      (queuedAction) => queuedAction.priority > action.priority,
    );

    if (insertIndex === -1) {
      this.actions.push(action);
      return;
    }

    this.actions.splice(insertIndex, 0, action);
  }

  public pushMultiple(actions: ReadonlyArray<DeferredAction>): void {
    actions.forEach((action) => this.push(action));
  }

  public drain(game: IGame): PlayerInput | undefined {
    while (!this.isEmpty()) {
      const action = this.actions.shift();
      if (!action) {
        return undefined;
      }

      const playerInput = action.execute(game);
      if (playerInput !== undefined) {
        return playerInput;
      }
    }

    return undefined;
  }

  public isEmpty(): boolean {
    return this.actions.length === 0;
  }

  public peek(): DeferredAction | undefined {
    return this.actions[0];
  }
}
