import { EAlienIcon, ETrace } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import { isGlyphidsAlienBoard } from '@/engine/alien/AlienBoard.js';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';

function getGlyphidsRows(player: IPlayer, game: IGame): EAlienIcon[][] {
  const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
  if (!isGlyphidsAlienBoard(board)) return [];
  return board.glyphRows[player.id] ?? [];
}

export function scoreGlyphidsMostCommonGlyph(
  player: IPlayer,
  game: IGame,
): number {
  const counts = new Map<EAlienIcon, number>();
  for (const glyph of getGlyphidsRows(player, game).flat()) {
    counts.set(glyph, (counts.get(glyph) ?? 0) + 1);
  }
  return 3 * Math.max(0, ...counts.values());
}

export function scoreGlyphidsLargestSet(player: IPlayer, game: IGame): number {
  return Math.max(
    0,
    ...getGlyphidsRows(player, game).map((row) => new Set(row).size),
  );
}

export function scoreAmoebaTraceEndGameCard(
  player: IPlayer,
  game: IGame,
  traceColor: ETrace,
): number {
  return (
    2 *
    game.alienState.getPlayerTraceCount(player, traceColor, {
      alienType: EAlienType.AMOEBA,
    })
  );
}
