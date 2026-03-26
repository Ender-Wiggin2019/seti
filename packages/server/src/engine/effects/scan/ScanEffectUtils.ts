import type { ESector } from '@seti/common/types/element';
import type { Sector } from '../../board/Sector.js';
import type { IGame } from '../../IGame.js';

export function getSectorAt(game: IGame, index: number): Sector | null {
  const s = game.sectors[index];
  if (s && typeof s === 'object' && 'markSignal' in s) {
    return s as Sector;
  }
  return null;
}

export function findSectorByColor(game: IGame, color: ESector): Sector | null {
  const sector = game.sectors.find(
    (s) =>
      s &&
      typeof s === 'object' &&
      'color' in s &&
      (s as Sector).color === color,
  );
  return (sector as Sector) ?? null;
}

export function getAllSectors(game: IGame): Sector[] {
  return game.sectors.filter(
    (s): s is Sector =>
      s !== null && typeof s === 'object' && 'markSignal' in (s as object),
  ) as Sector[];
}

export function extractSectorColorFromCardItem(
  cardItem: unknown,
): ESector | null {
  if (
    cardItem !== null &&
    typeof cardItem === 'object' &&
    'sector' in cardItem
  ) {
    return (cardItem as { sector: ESector }).sector;
  }

  return null;
}
