import { EPlanet } from '@seti/common/types/protocol/enums';
import { scoreEndGameCard } from '@/engine/scoring/GoldScoringTile.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('GrandTourProgram', () => {
  it('scores 2 VP per non-moon planet with an own orbiter or lander', () => {
    const game = buildTestGame({ seed: 'sa-39-completion' });
    const player = getPlayer(game, 'p1');
    const mars = game.planetaryBoard?.planets.get(EPlanet.MARS);
    const venus = game.planetaryBoard?.planets.get(EPlanet.VENUS);
    const jupiter = game.planetaryBoard?.planets.get(EPlanet.JUPITER);
    if (!mars || !venus || !jupiter) throw new Error('missing planet state');
    mars.orbitSlots.push({ playerId: player.id });
    venus.landingSlots.push({ playerId: player.id });
    jupiter.moonOccupants.push({ playerId: player.id, moonId: 'io' });

    expect(scoreEndGameCard('SA.39', player, game)).toBe(4);
  });
});
