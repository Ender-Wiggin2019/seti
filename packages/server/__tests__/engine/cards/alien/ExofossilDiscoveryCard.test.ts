import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ExofossilDiscovery } from '@/engine/cards/alien/ExofossilDiscoveryCard.js';
import { discoverOumuamua } from '../../../helpers/OumuamuaTestUtils.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('ExofossilDiscovery', () => {
  it('marks the Oumuamua sector while preserving the sector/tile choice', () => {
    const game = buildTestGame({ seed: 'et-23-oumuamua-choice' });
    const player = getPlayer(game, 'p1');
    const { plugin } = discoverOumuamua(game);
    const stateBefore = plugin.getRuntimeState(game);
    if (!stateBefore?.meta) throw new Error('missing oumuamua state');
    const card = new ExofossilDiscovery();

    card.play({ player, game });
    const pending = game.deferredActions.drain(game);
    const model = pending?.toModel() as ISelectOptionInputModel | undefined;

    expect(card.id).toBe('ET.23');
    expect(card.behavior.custom ?? []).not.toContain('desc.et-23');
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    expect(model?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining(['oumuamua-sector', 'oumuamua-tile']),
    );

    pending?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'oumuamua-tile',
    });

    expect(plugin.getRuntimeState(game)?.tileDataRemaining).toBe(
      stateBefore.tileDataRemaining - 1,
    );
  });
});
