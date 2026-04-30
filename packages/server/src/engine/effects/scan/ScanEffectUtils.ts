import {
  type EStarName,
  type ISolarSystemSetupConfig,
  SECTOR_TILE_DEFINITIONS,
} from '@seti/common/constant/sectorSetup';
import { sectorIndexOf } from '@seti/common/constant/solarCoordinate';
import type { ESector } from '@seti/common/types/element';
import type { EPlanet } from '@seti/common/types/protocol/enums';
import type { Sector } from '../../board/Sector.js';
import type { SolarSystem } from '../../board/SolarSystem.js';
import { hasCardData, loadCardData } from '../../cards/loadCardData.js';
import type { IGame } from '../../IGame.js';

export function getSectorAt(game: IGame, index: number): Sector | null {
  const s = game.sectors[index];
  if (s && typeof s === 'object' && 'markSignal' in s) {
    return s as Sector;
  }
  return null;
}

export function findSectorById(game: IGame, sectorId: string): Sector | null {
  const sector = game.sectors.find(
    (s) =>
      s &&
      typeof s === 'object' &&
      'id' in s &&
      'markSignal' in s &&
      (s as Sector).id === sectorId,
  );
  return (sector as Sector) ?? null;
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

export function findAllSectorsByColor(game: IGame, color: ESector): Sector[] {
  return game.sectors.filter(
    (s): s is Sector =>
      s !== null &&
      typeof s === 'object' &&
      'color' in s &&
      (s as Sector).color === color,
  ) as Sector[];
}

export function findSectorIdByStarName(
  setup: ISolarSystemSetupConfig | null,
  starName: EStarName,
): string | undefined {
  if (!setup) return undefined;

  for (const placement of setup.tilePlacements) {
    const sectors = SECTOR_TILE_DEFINITIONS[placement.tileId].sectors;
    if (sectors[0].starName === starName) {
      return placement.sectorIds[0];
    }
    if (sectors[1].starName === starName) {
      return placement.sectorIds[1];
    }
  }

  return undefined;
}

/**
 * Resolve a planet's current position on the solar system to a sector index (0..7).
 *
 * Prefers the O(1) index maintained by {@link SolarSystem}. Falls back to
 * the legacy `getSpacesOnPlanet(...)` scan so tests that stub `solarSystem`
 * with a minimal duck-typed object keep working.
 */
export function getSectorIndexByPlanet(
  solarSystem: SolarSystem,
  planet: EPlanet,
): number | null {
  const maybe = solarSystem as {
    getSectorIndexOfPlanet?: (p: EPlanet) => number | null;
  };
  if (typeof maybe.getSectorIndexOfPlanet === 'function') {
    return maybe.getSectorIndexOfPlanet(planet);
  }

  const spaces = solarSystem.getSpacesOnPlanet(planet);
  if (spaces.length === 0) return null;
  const space = spaces[0];
  return Math.floor(space.indexInRing / space.ringIndex);
}

export function getSectorIndexBySpace(space: {
  ringIndex: number;
  indexInRing: number;
}): number | null {
  try {
    return sectorIndexOf(space.ringIndex, space.indexInRing);
  } catch {
    return null;
  }
}

/**
 * Resolve a planet's current position to the Sector object it occupies.
 * Returns null if the solar system is absent or the planet can't be resolved.
 */
export function getSectorByPlanet(game: IGame, planet: EPlanet): Sector | null {
  if (!game.solarSystem) return null;
  const index = getSectorIndexByPlanet(game.solarSystem, planet);
  if (index === null) return null;
  return getSectorAt(game, index);
}

export function getAllSectors(game: IGame): Sector[] {
  return game.sectors.filter(
    (s): s is Sector =>
      s !== null && typeof s === 'object' && 'markSignal' in (s as object),
  ) as Sector[];
}

export function getSectorIdsWithPlayerProbes(
  game: IGame,
  playerId: string,
): string[] {
  if (!game.solarSystem) return [];

  const uniqueIds = new Set<string>();
  const solarSystem = game.solarSystem as SolarSystem & {
    getSectorIndexOfSpace?: (spaceId: string) => number | null;
  };

  for (const space of game.solarSystem.spaces) {
    if (!space.occupants.some((occupant) => occupant.playerId === playerId)) {
      continue;
    }
    if (space.ringIndex <= 0) {
      continue;
    }

    const sectorIndex =
      solarSystem.getSectorIndexOfSpace?.(space.id) ??
      getSectorIndexBySpace(space);
    if (sectorIndex === null) {
      continue;
    }

    const sector = getSectorAt(game, sectorIndex);
    if (sector) {
      uniqueIds.add(sector.id);
    }
  }

  return Array.from(uniqueIds.values());
}

export function extractSectorColorFromCardItem(
  cardItem: unknown,
): ESector | null {
  if (typeof cardItem === 'string') {
    if (hasCardData(cardItem)) {
      return loadCardData(cardItem).sector ?? null;
    }
    return null;
  }

  if (
    cardItem !== null &&
    typeof cardItem === 'object' &&
    'sector' in cardItem
  ) {
    return (cardItem as { sector: ESector }).sector;
  }

  return null;
}
