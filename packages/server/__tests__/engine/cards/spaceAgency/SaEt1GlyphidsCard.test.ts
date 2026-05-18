import { EAlienIcon } from '@seti/common/types/element';
import { scoreEndGameCard } from '@/engine/scoring/GoldScoringTile.js';
import {
  createDiscoveredGlyphidsGame,
  setGlyphRows,
} from './SpaceAgencyAlienCardTestUtils.js';

describe('SA.ET.1 Glyphids end-game scoring', () => {
  it('scores 3 VP per glyph of the type the player has the most of', () => {
    const { game, board } = createDiscoveredGlyphidsGame('sa-et-1-scoring');
    const [player] = game.players;
    setGlyphRows(board, player.id, [
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE, EAlienIcon.GLYPH_GREEN],
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_YELLOW],
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_PURPLE],
      [EAlienIcon.GLYPH_BLUE],
    ]);

    expect(scoreEndGameCard('SA.ET.1', player, game)).toBe(9);
  });
});
