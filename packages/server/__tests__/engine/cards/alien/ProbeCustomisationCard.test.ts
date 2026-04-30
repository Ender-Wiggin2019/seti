import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ProbeCustomisation } from '@/engine/cards/alien/ProbeCustomisationCard.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { discoverOumuamua } from '../../../helpers/OumuamuaTestUtils.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

function resolveUntilMovementPrompt(input: IPlayerInput | undefined) {
  let pending = input;
  let guard = 0;
  while (pending) {
    guard += 1;
    if (guard > 20) throw new Error('input resolution exceeded 20 steps');
    const model = pending.toModel() as ISelectOptionInputModel;
    if (model.type !== EPlayerInputType.OPTION) {
      throw new Error(`unsupported input type ${model.type}`);
    }
    if (
      model.options.some((option) => option.id === 'use-exofossil-gain-2-move')
    ) {
      return pending;
    }
    const option = model.options[0];
    if (!option) throw new Error('missing option');
    pending = pending.process({
      type: EPlayerInputType.OPTION,
      optionId: option.id,
    });
  }
  return undefined;
}

describe('ProbeCustomisation', () => {
  it('can repeatedly spend exofossils for 2 movement before stopping', () => {
    const game = buildTestGame({ seed: 'et-25-move-loop' });
    const player = getPlayer(game, 'p1');
    discoverOumuamua(game);
    player.gainExofossils(2);
    const moveBefore = player.getMoveStash();
    const card = new ProbeCustomisation();

    card.play({ player, game });
    const movementPrompt = resolveUntilMovementPrompt(
      game.deferredActions.drain(game),
    );
    expect(movementPrompt).toBeDefined();

    const secondPrompt = movementPrompt?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'use-exofossil-gain-2-move',
    });
    secondPrompt?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'stop-use-exofossil-gain-2-move',
    });

    expect(card.id).toBe('ET.25');
    expect(card.behavior.custom ?? []).not.toContain('desc.et-25');
    expect(card.behavior.custom ?? []).not.toContain('Then');
    expect(player.exofossils).toBe(1);
    expect(player.getMoveStash()).toBe(moveBefore + 2);
  });
});
