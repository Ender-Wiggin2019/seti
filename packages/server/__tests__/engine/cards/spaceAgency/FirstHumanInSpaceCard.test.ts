import { scoreEndGameCard } from '@/engine/scoring/GoldScoringTile.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('FirstHumanInSpace', () => {
  it('scores one VP per remaining publicity', () => {
    const game = buildTestGame({ seed: 'sa-10-completion' });
    const player = getPlayer(game, 'p1');
    player.resources.setPublicity(7);

    expect(scoreEndGameCard('SA.10', player, game)).toBe(7);
  });
});
