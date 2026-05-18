import { ETrace } from '@seti/common/types/element';
import { scoreEndGameCard } from '@/engine/scoring/GoldScoringTile.js';
import {
  createDiscoveredAmoebaGame,
  markAmoebaTrace,
} from './SpaceAgencyAlienCardTestUtils.js';

describe('SA.ET.13 Genome Characterization end-game scoring', () => {
  it('scores 2 VP per blue trace marked for Amoeba, including overflow', () => {
    const { game, board } = createDiscoveredAmoebaGame('sa-et-13-scoring');
    const [player] = game.players;
    markAmoebaTrace(board, player.id, ETrace.BLUE);
    markAmoebaTrace(board, player.id, ETrace.BLUE, { overflow: true });
    markAmoebaTrace(board, player.id, ETrace.RED);

    expect(scoreEndGameCard('SA.ET.13', player, game)).toBe(4);
  });
});
