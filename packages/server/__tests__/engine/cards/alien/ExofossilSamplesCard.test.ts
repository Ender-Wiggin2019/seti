import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ExofossilSamples } from '@/engine/cards/alien/ExofossilSamplesCard.js';
import type { Game } from '@/engine/Game.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { discoverOumuamua } from '../../../helpers/OumuamuaTestUtils.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

function resolveUntilDataPrompt(game: Game) {
  let pending: IPlayerInput | undefined = game.deferredActions.drain(game);
  let guard = 0;
  while (pending || !game.deferredActions.isEmpty()) {
    if (!pending) {
      pending = game.deferredActions.drain(game);
      continue;
    }
    guard += 1;
    if (guard > 20) throw new Error('input resolution exceeded 20 steps');
    const model = pending.toModel() as ISelectOptionInputModel;
    if (model.type !== EPlayerInputType.OPTION) {
      throw new Error(`unsupported input type ${model.type}`);
    }
    if (
      model.options.some((option) => option.id === 'use-exofossil-gain-data')
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

describe('ExofossilSamples', () => {
  it('may spend 1 exofossil to gain 1 data', () => {
    const game = buildTestGame({ seed: 'et-28-data' });
    const player = getPlayer(game, 'p1');
    discoverOumuamua(game);
    player.gainExofossils(1);
    const dataBefore = player.resources.data;
    const card = new ExofossilSamples();

    card.play({ player, game });
    const dataPrompt = resolveUntilDataPrompt(game);
    expect(dataPrompt).toBeDefined();

    dataPrompt?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'use-exofossil-gain-data',
    });

    expect(card.id).toBe('ET.28');
    expect(card.behavior.custom ?? []).not.toContain('desc.et-28');
    expect(player.exofossils).toBe(0);
    expect(player.resources.data).toBe(dataBefore + 1);
  });
});
