import { ETechId } from '@seti/common/types/tech';
import { AkatsukuOrbiter } from '@/engine/cards/spaceAgency/AkatsukuOrbiterCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('AkatsukuOrbiter', () => {
  it('gains one data for each computer tech', () => {
    const game = buildTestGame({ seed: 'sa-30' });
    const player = getPlayer(game, 'p1');
    player.techs = [ETechId.COMPUTER_VP_CREDIT, ETechId.SCAN_EARTH_LOOK];
    const card = new AkatsukuOrbiter();

    card.play({ player, game });
    game.deferredActions.drain(game);
    game.deferredActions.drain(game);

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_30');
    expect(player.resources.data).toBe(1);
  });
});
