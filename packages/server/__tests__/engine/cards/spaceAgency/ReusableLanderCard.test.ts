import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ReusableLander } from '@/engine/cards/spaceAgency/ReusableLanderCard.js';
import {
  buildTestGame,
  getPlayer,
  placeProbeOnPlanet,
} from '../../../helpers/TestGameBuilder.js';

describe('ReusableLander', () => {
  it('returns itself to hand after landing on a planet that already had a lander', () => {
    const game = buildTestGame({ seed: 'sa-1' });
    const player = getPlayer(game, 'p1');
    const other = getPlayer(game, 'p2');
    game.planetaryBoard?.setProbeCount(EPlanet.MARS, other.id, 1);
    game.planetaryBoard?.land(EPlanet.MARS, other.id, { allowDuplicate: true });
    placeProbeOnPlanet(game, player.id, EPlanet.MARS);
    player.probesInSpace = 1;
    const card = new ReusableLander();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: `land-${EPlanet.MARS}`,
    });
    game.deferredActions.drain(game);

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_1');
    expect(player.hand).toContain('SA.1');
  });
});
