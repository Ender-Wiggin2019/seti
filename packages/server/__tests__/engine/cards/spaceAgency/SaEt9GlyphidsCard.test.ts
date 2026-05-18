import { EAlienIcon } from '@seti/common/types/element';
import { scoreEndGameCard } from '@/engine/scoring/GoldScoringTile.js';
import {
  createDiscoveredGlyphidsGame,
  setGlyphRows,
} from './SpaceAgencyAlienCardTestUtils.js';

describe('SA.ET.9 Glyphids end-game scoring', () => {
  it("scores 1 VP per glyph in the player's largest set", () => {
    const { game, board } = createDiscoveredGlyphidsGame('sa-et-9-scoring');
    const [player] = game.players;
    setGlyphRows(board, player.id, [
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE],
      [
        EAlienIcon.GLYPH_RED,
        EAlienIcon.GLYPH_YELLOW,
        EAlienIcon.GLYPH_GREEN,
        EAlienIcon.GLYPH_PURPLE,
      ],
      [EAlienIcon.GLYPH_BLUE, EAlienIcon.GLYPH_GRAY],
    ]);

    expect(scoreEndGameCard('SA.ET.9', player, game)).toBe(4);
  });
});
