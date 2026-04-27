import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { HerschelSpaceObservatory } from '@/engine/cards/base/HerschelSpaceObservatoryCard.js';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { Game } from '@/engine/Game.js';
import { Player } from '@/engine/player/Player.js';
import { discoverOumuamua } from '../../../helpers/OumuamuaTestUtils.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

describe('HerschelSpaceObservatory', () => {
  it('loads expected card metadata', () => {
    const card = new HerschelSpaceObservatory();
    expect(card.id).toBe('134');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new HerschelSpaceObservatory();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('134');
    expect(mission.branches.length).toBeGreaterThan(0);
  });

  it('offers sector/tile choice when the probe sector contains oumuamua', () => {
    const game = Game.create(
      [
        { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
        { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
      ],
      { playerCount: 2 },
      'herschel-oumuamua-probe-sector',
      'herschel-oumuamua-probe-sector',
    );
    resolveSetupTucks(game);
    const player = game.players[0] as Player;
    const { plugin } = discoverOumuamua(game);
    const state = plugin.getRuntimeState(game);
    if (!state?.meta) throw new Error('missing oumuamua state');
    game.solarSystem?.placeProbe(player.id, state.meta.spaceId);

    const card = getCardRegistry().create('134');
    card.play({ player, game });

    const pendingInput = game.deferredActions.drain(game);
    const model = pendingInput?.toModel() as
      | ISelectOptionInputModel
      | undefined;
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    expect(model?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining(['oumuamua-sector', 'oumuamua-tile']),
    );
  });
});
