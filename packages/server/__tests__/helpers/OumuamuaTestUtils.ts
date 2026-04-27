import { EAlienType } from '@seti/common/types/protocol/enums';
import { AlienState } from '@/engine/alien/AlienState.js';
import { OumuamuaAlienPlugin } from '@/engine/alien/plugins/OumuamuaAlienPlugin.js';
import type { Sector } from '@/engine/board/Sector.js';
import type { Game } from '@/engine/Game.js';

export function discoverOumuamua(game: Game): {
  plugin: OumuamuaAlienPlugin;
  sector: Sector;
  sectorIndex: number;
} {
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.OUMUAMUA]);
  const board = game.alienState.getBoardByType(EAlienType.OUMUAMUA);
  if (!board) {
    throw new Error('expected oumuamua board');
  }
  board.discovered = true;

  const plugin = new OumuamuaAlienPlugin();
  plugin.onDiscover(game, []);

  const state = plugin.getRuntimeState(game);
  if (!state?.meta) {
    throw new Error('expected oumuamua runtime metadata');
  }

  const sectorIndex = game.sectors.findIndex(
    (sector) => sector.id === state.meta?.sectorId,
  );
  if (sectorIndex < 0) {
    throw new Error('expected oumuamua sector');
  }

  return {
    plugin,
    sector: game.sectors[sectorIndex] as Sector,
    sectorIndex,
  };
}
