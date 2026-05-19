import { ETrace } from '@seti/common/types/element';
import { scoreEndGameCard } from '@/engine/scoring/GoldScoringTile.js';
import {
  createDiscoveredAmoebaGame,
  markAmoebaTrace,
} from './SpaceAgencyAlienCardTestUtils.js';

describe('SA.ET.11 Biosignature Screening end-game scoring', () => {
  it('scores 2 VP per red trace marked for Amoeba, including overflow', () => {
    const { game, board } = createDiscoveredAmoebaGame('sa-et-11-scoring');
    const [player] = game.players;
    markAmoebaTrace(board, player.id, ETrace.PINK);
    markAmoebaTrace(board, player.id, ETrace.PINK, { overflow: true });
    markAmoebaTrace(board, player.id, ETrace.YELLOW);

    expect(scoreEndGameCard('SA.ET.11', player, game)).toBe(4);
  });
});
