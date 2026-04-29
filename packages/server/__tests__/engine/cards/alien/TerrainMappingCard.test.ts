import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { TerrainMapping } from '@/engine/cards/alien/TerrainMappingCard.js';
import type { Game } from '@/engine/Game.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { discoverOumuamua } from '../../../helpers/OumuamuaTestUtils.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

function resolveUntilUseExofossil(game: Game) {
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
      model.options.some(
        (option) => option.id === 'use-exofossil-mark-any-signal',
      )
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

describe('TerrainMapping', () => {
  it('may spend 1 exofossil to mark an additional signal', () => {
    const game = buildTestGame({ seed: 'et-24-extra-signal' });
    const player = getPlayer(game, 'p1');
    discoverOumuamua(game);
    player.gainExofossils(1);
    const card = new TerrainMapping();

    card.play({ player, game });
    const usePrompt = resolveUntilUseExofossil(game);
    expect(usePrompt).toBeDefined();

    usePrompt?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'use-exofossil-mark-any-signal',
    });

    expect(card.id).toBe('ET.24');
    expect(card.behavior.custom ?? []).not.toContain('desc.et-24');
    expect(player.exofossils).toBe(0);
  });
});
