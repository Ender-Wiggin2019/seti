import { ETechId } from '@seti/common/types/tech';
import { PrivateSectorInvestment } from '@/engine/cards/spaceAgency/PrivateSectorInvestmentCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('PrivateSectorInvestment', () => {
  it('draws one card for each tech in the largest owned tech category', () => {
    const game = buildTestGame({ seed: 'sa-34' });
    const player = getPlayer(game, 'p1');
    player.techs = [
      ETechId.COMPUTER_VP_CREDIT,
      ETechId.COMPUTER_VP_ENERGY,
      ETechId.SCAN_EARTH_LOOK,
    ];
    player.hand = [];
    const card = new PrivateSectorInvestment();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_34');
    expect(player.hand.length).toBe(2);
  });
});
