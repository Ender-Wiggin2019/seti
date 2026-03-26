import type { IInputResponse } from '@seti/common/types/protocol/actions';
import type { IPlayerInputModel } from '@seti/common/types/protocol/playerInput';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { BasePlayerInput } from '@/engine/input/PlayerInput.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

class TestInput extends BasePlayerInput {
  public constructor(player: IPlayer) {
    super(player, EPlayerInputType.OPTION, 'test-input', 'test-input-id');
  }

  public toModel(): IPlayerInputModel {
    return {
      inputId: this.inputId,
      type: EPlayerInputType.OPTION,
      title: this.title,
      options: [{ id: 'ok', label: 'OK' }],
    };
  }

  public process(response: IInputResponse) {
    this.validateResponseType(response, EPlayerInputType.OPTION);
    return undefined;
  }
}

describe('BasePlayerInput', () => {
  it('exposes base metadata', () => {
    const player = { id: 'p1' } as IPlayer;
    const input = new TestInput(player);

    expect(input.inputId).toBe('test-input-id');
    expect(input.player).toBe(player);
    expect(input.type).toBe(EPlayerInputType.OPTION);
    expect(input.title).toBe('test-input');
  });

  it('validates response type before processing', () => {
    const input = new TestInput({ id: 'p1' } as IPlayer);

    expect(() =>
      input.process({ type: EPlayerInputType.CARD, cardIds: [] }),
    ).toThrow();
  });
});
