import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IGamePlayerIdentity } from '@/engine/IGame.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

const TEST_PLAYER: IGamePlayerIdentity = {
  id: 'p1',
  name: 'Alice',
  color: 'red',
  seatIndex: 0,
};

describe('SimpleDeferredAction', () => {
  it('executes callback and returns callback result', () => {
    const callback = vi.fn().mockReturnValue({
      inputId: 'input-1',
      type: EPlayerInputType.OPTION,
      player: TEST_PLAYER as unknown as IPlayer,
      toModel: () => ({
        inputId: 'input-1',
        type: EPlayerInputType.OPTION,
        options: [{ id: 'ok', label: 'OK' }],
      }),
      process: () => undefined,
    });
    const action = new SimpleDeferredAction(TEST_PLAYER, callback);
    const game = {} as never;

    const result = action.execute(game);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(game);
    expect(result).toMatchObject({
      inputId: 'input-1',
      type: EPlayerInputType.OPTION,
    });
  });
});
