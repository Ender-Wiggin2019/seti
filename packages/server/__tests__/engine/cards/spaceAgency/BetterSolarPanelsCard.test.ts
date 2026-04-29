import { EPlanet } from '@seti/common/types/protocol/enums';
import { BetterSolarPanels } from '@/engine/cards/spaceAgency/BetterSolarPanelsCard.js';
import {
  buildTestGame,
  getPlayer,
  placeProbeOnPlanet,
} from '../../../helpers/TestGameBuilder.js';

describe('BetterSolarPanels', () => {
  it('at 0 energy gains one energy for each own probe in space', () => {
    const game = buildTestGame({ seed: 'sa-27' });
    const player = getPlayer(game, 'p1');
    player.probeSpaceLimit = 2;
    placeProbeOnPlanet(game, player.id, EPlanet.MARS);
    placeProbeOnPlanet(game, player.id, EPlanet.VENUS);
    player.probesInSpace = 2;
    player.resources.spend({ energy: player.resources.energy });
    const card = new BetterSolarPanels();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_27');
    expect(player.resources.energy).toBe(2);
  });
});
