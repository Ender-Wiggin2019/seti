import { ETrace } from '@seti/common/types/element';
import { scoreEndGameCard } from '@/engine/scoring/GoldScoringTile.js';
import {
  createDiscoveredAmoebaGame,
  markAmoebaTrace,
} from './SpaceAgencyAlienCardTestUtils.js';

describe('SA.ET.12 Physical Characterization end-game scoring', () => {
  it('scores 2 VP per yellow trace marked for Amoeba, including overflow', () => {
    const { game, board } = createDiscoveredAmoebaGame('sa-et-12-scoring');
    const [player] = game.players;
    markAmoebaTrace(board, player.id, ETrace.YELLOW);
    markAmoebaTrace(board, player.id, ETrace.YELLOW, { overflow: true });
    markAmoebaTrace(board, player.id, ETrace.BLUE);

    expect(scoreEndGameCard('SA.ET.12', player, game)).toBe(4);
  });
});
