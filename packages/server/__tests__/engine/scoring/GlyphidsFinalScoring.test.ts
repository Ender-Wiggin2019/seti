import { EAlienIcon } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import {
  type GlyphidsAlienBoard,
  isGlyphidsAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { Game } from '@/engine/Game.js';
import { FinalScoring } from '@/engine/scoring/FinalScoring.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

const TWO_PLAYER_IDENTITIES = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

const SOLO_IDENTITIES = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  {
    id: 'rival:glyphids-final-scoring',
    name: 'Rival Institution',
    color: 'blue',
    seatIndex: 1,
  },
] as const;

function createTwoPlayerGlyphidsGame(seed: string): {
  game: Game;
  board: GlyphidsAlienBoard;
} {
  const game = Game.create(
    TWO_PLAYER_IDENTITIES,
    { playerCount: 2 },
    seed,
    seed,
  );
  resolveSetupTucks(game);
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
  const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
  if (!isGlyphidsAlienBoard(board)) {
    throw new Error('expected Glyphids board');
  }
  board.discovered = true;
  return { game, board };
}

function createSoloGlyphidsGame(seed: string): {
  game: Game;
  board: GlyphidsAlienBoard;
} {
  const game = Game.create(
    SOLO_IDENTITIES,
    { playerCount: 2, isSoloMode: true, soloDifficulty: 2 },
    seed,
    seed,
  );
  resolveSetupTucks(game);
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
  const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
  if (!isGlyphidsAlienBoard(board)) {
    throw new Error('expected Glyphids board');
  }
  board.discovered = true;
  return { game, board };
}

describe('Glyphids final scoring', () => {
  it('scores human collected glyph rows as sets using the Glyphids scale', () => {
    const { game, board } = createTwoPlayerGlyphidsGame('glyphids-final-human');
    board.glyphRows.p1 = [
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE, EAlienIcon.GLYPH_GREEN],
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_YELLOW],
      [EAlienIcon.GLYPH_BLUE],
    ];

    const result = FinalScoring.score(game);

    expect(result.breakdown.p1.alienBonus).toBe(9);
    expect(result.breakdown.p2.alienBonus).toBe(0);
  });

  it('scores solo rival collected glyphs as 3 VP per token regardless of set', () => {
    const { game, board } = createSoloGlyphidsGame('glyphids-final-rival');
    board.glyphRows['rival:glyphids-final-scoring'] = [
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE, EAlienIcon.GLYPH_GREEN],
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_YELLOW],
    ];

    const result = FinalScoring.score(game);

    expect(result.breakdown['rival:glyphids-final-scoring'].alienBonus).toBe(
      15,
    );
  });
});
