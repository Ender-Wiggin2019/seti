import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IGame, IGamePlayerIdentity } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

const TEST_PLAYER: IGamePlayerIdentity = {
  id: 'p1',
  name: 'Alice',
  color: 'red',
  seatIndex: 0,
};

function createQueueBackedGame(queue: DeferredActionsQueue): IGame {
  return {
    deferredActions: queue,
  } as IGame;
}

describe('DeferredActionsQueue', () => {
  it('executes actions by priority order', () => {
    const queue = new DeferredActionsQueue();
    const game = createQueueBackedGame(queue);
    const executionOrder: string[] = [];

    queue.push(
      new SimpleDeferredAction(
        TEST_PLAYER,
        () => {
          executionOrder.push('default');
          return undefined;
        },
        EPriority.DEFAULT,
      ),
    );
    queue.push(
      new SimpleDeferredAction(
        TEST_PLAYER,
        () => {
          executionOrder.push('cost');
          return undefined;
        },
        EPriority.COST,
      ),
    );
    queue.push(
      new SimpleDeferredAction(
        TEST_PLAYER,
        () => {
          executionOrder.push('reward');
          return undefined;
        },
        EPriority.IMMEDIATE_REWARD,
      ),
    );

    const pendingInput = queue.drain(game);

    expect(pendingInput).toBeUndefined();
    expect(executionOrder).toEqual(['cost', 'reward', 'default']);
    expect(queue.isEmpty()).toBe(true);
  });

  it('pauses drain when an action returns PlayerInput', () => {
    const queue = new DeferredActionsQueue();
    const game = createQueueBackedGame(queue);
    const executionOrder: string[] = [];
    const pendingInput = {
      inputId: 'input-1',
      type: EPlayerInputType.OPTION,
      player: TEST_PLAYER as unknown as IPlayer,
      toModel: () => ({
        inputId: 'input-1',
        type: EPlayerInputType.OPTION,
        options: [{ id: 'ok', label: 'OK' }],
      }),
      process: () => undefined,
    } as unknown as IPlayerInput;

    queue.push(
      new SimpleDeferredAction(TEST_PLAYER, (_game: IGame) => {
        executionOrder.push('first');
        return undefined;
      }),
    );
    queue.push(
      new SimpleDeferredAction(TEST_PLAYER, (_game: IGame) => {
        executionOrder.push('pause');
        return pendingInput;
      }),
    );
    queue.push(
      new SimpleDeferredAction(TEST_PLAYER, (_game: IGame) => {
        executionOrder.push('last');
        return undefined;
      }),
    );

    const result = queue.drain(game);

    expect(result).toBe(pendingInput);
    expect(executionOrder).toEqual(['first', 'pause']);
    expect(queue.peek()).toBeDefined();
  });

  it('keeps new actions sorted when pushed during drain', () => {
    const queue = new DeferredActionsQueue();
    const game = createQueueBackedGame(queue);
    const executionOrder: string[] = [];

    queue.push(
      new SimpleDeferredAction(TEST_PLAYER, (currentGame) => {
        executionOrder.push('initial-default');
        currentGame.deferredActions.push(
          new SimpleDeferredAction(
            TEST_PLAYER,
            () => {
              executionOrder.push('new-cost');
              return undefined;
            },
            EPriority.COST,
          ),
        );
        currentGame.deferredActions.push(
          new SimpleDeferredAction(TEST_PLAYER, () => {
            executionOrder.push('new-default');
            return undefined;
          }),
        );
        return undefined;
      }),
    );
    queue.push(
      new SimpleDeferredAction(TEST_PLAYER, () => {
        executionOrder.push('existing-default');
        return undefined;
      }),
    );

    queue.drain(game);

    expect(executionOrder).toEqual([
      'initial-default',
      'new-cost',
      'existing-default',
      'new-default',
    ]);
  });

  it('returns undefined when draining an empty queue', () => {
    const queue = new DeferredActionsQueue();
    const game = createQueueBackedGame(queue);

    expect(queue.drain(game)).toBeUndefined();
  });

  it('preserves FIFO order for equal priorities', () => {
    const queue = new DeferredActionsQueue();
    const game = createQueueBackedGame(queue);
    const executionOrder: string[] = [];

    queue.pushMultiple([
      new SimpleDeferredAction(TEST_PLAYER, () => {
        executionOrder.push('first');
        return undefined;
      }),
      new SimpleDeferredAction(TEST_PLAYER, () => {
        executionOrder.push('second');
        return undefined;
      }),
      new SimpleDeferredAction(TEST_PLAYER, () => {
        executionOrder.push('third');
        return undefined;
      }),
    ]);

    queue.drain(game);

    expect(executionOrder).toEqual(['first', 'second', 'third']);
  });
});
