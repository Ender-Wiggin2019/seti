import { EPlanet } from '@seti/common/types/protocol/enums';
import { ReusableRocket } from '@/engine/cards/spaceAgency/ReusableRocketCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('ReusableRocket', () => {
  it('returns itself to hand if another player has a probe on Earth', () => {
    const game = buildTestGame({ seed: 'sa-14' });
    const player = getPlayer(game, 'p1');
    const other = getPlayer(game, 'p2');
    const earthSpace = game.solarSystem?.getSpacesOnPlanet(EPlanet.EARTH)[0];
    if (!earthSpace) throw new Error('missing Earth');
    game.solarSystem?.placeProbe(other.id, earthSpace.id);
    other.probesInSpace = 1;
    const card = new ReusableRocket();

    card.play({ player, game });
    game.deferredActions.drain(game);
    game.deferredActions.drain(game);

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_14');
    expect(player.hand).toContain('SA.14');
  });
});
