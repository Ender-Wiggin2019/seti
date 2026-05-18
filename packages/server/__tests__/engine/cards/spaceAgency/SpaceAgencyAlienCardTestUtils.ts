import type { TGlyphidsGlyph } from '@seti/common/constant/spaceAgencyAliens';
import { ETrace } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import {
  type AmoebaAlienBoard,
  type GlyphidsAlienBoard,
  isAmoebaAlienBoard,
  isGlyphidsAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { Game } from '@/engine/Game.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

export function createSpaceAgencyAlienGame(seed: string): Game {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  return game;
}

export function createDiscoveredGlyphidsGame(seed: string): {
  game: Game;
  board: GlyphidsAlienBoard;
} {
  const game = createSpaceAgencyAlienGame(seed);
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
  const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
  if (!isGlyphidsAlienBoard(board)) {
    throw new Error('expected Glyphids board');
  }
  game.alienState.discoverAlien(board, game);
  return { game, board };
}

export function createDiscoveredAmoebaGame(seed: string): {
  game: Game;
  board: AmoebaAlienBoard;
} {
  const game = createSpaceAgencyAlienGame(seed);
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.AMOEBA]);
  const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
  if (!isAmoebaAlienBoard(board)) {
    throw new Error('expected Amoeba board');
  }
  game.alienState.discoverAlien(board, game);
  return { game, board };
}

export function setGlyphRows(
  board: GlyphidsAlienBoard,
  playerId: string,
  rows: TGlyphidsGlyph[][],
): void {
  board.glyphRows[playerId] = rows;
}

export function markAmoebaTrace(
  board: AmoebaAlienBoard,
  playerId: string,
  traceColor: ETrace,
  options: { overflow?: boolean } = {},
): void {
  const slots = options.overflow
    ? board.overflowSlots
    : board.speciesTraceSlots;
  const slot = slots.find((candidate) => candidate.traceColor === traceColor);
  if (!slot) {
    throw new Error(`expected Amoeba ${traceColor} slot`);
  }
  if (!board.placeTrace(slot, { playerId }, traceColor)) {
    throw new Error(`failed to mark Amoeba ${traceColor} slot`);
  }
}
