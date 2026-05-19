import { EPlanet } from '@seti/common/types/protocol/enums';
import { scoreEndGameCard } from '@/engine/scoring/GoldScoringTile.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('IngenuityHelicopter', () => {
  it('scores 6 VP per non-moon planet with at least two own landers', () => {
    const game = buildTestGame({ seed: 'sa-31-completion' });
    const player = getPlayer(game, 'p1');
    const mars = game.planetaryBoard?.planets.get(EPlanet.MARS);
    const venus = game.planetaryBoard?.planets.get(EPlanet.VENUS);
    const jupiter = game.planetaryBoard?.planets.get(EPlanet.JUPITER);
    if (!mars || !venus || !jupiter) throw new Error('missing planet state');
    mars.landingSlots.push({ playerId: player.id }, { playerId: player.id });
    venus.landingSlots.push({ playerId: player.id }, { playerId: player.id });
    jupiter.moonOccupants.push(
      { playerId: player.id, moonId: 'io' },
      { playerId: player.id, moonId: 'europa' },
    );

    expect(scoreEndGameCard('SA.31', player, game)).toBe(12);
  });
});
