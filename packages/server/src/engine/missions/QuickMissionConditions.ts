import { ETrace } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { ESolarSystemElementType } from '../board/SolarSystem.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

type TConditionFn = (player: IPlayer, game: IGame) => boolean;

/**
 * Check if a player has at least `count` probes orbiting or landed
 * at a specific planet (including moon occupant).
 */
export function orbitOrLandAt(planet: EPlanet, count = 1): TConditionFn {
  return (player, game) => {
    if (!game.planetaryBoard) return false;
    const state = game.planetaryBoard.planets.get(planet);
    if (!state) return false;
    const orbitCount = state.orbitSlots.filter(
      (s) => s.playerId === player.id,
    ).length;
    const landCount = state.landingSlots.filter(
      (s) => s.playerId === player.id,
    ).length;
    const moonCount = state.moonOccupant?.playerId === player.id ? 1 : 0;
    return orbitCount + landCount + moonCount >= count;
  };
}

/**
 * Check if a player has at least `count` total landings across all planets.
 * Optionally excludes moon landings.
 */
export function totalLandings(
  count: number,
  excludeMoons = false,
): TConditionFn {
  return (player, game) => {
    if (!game.planetaryBoard) return false;
    let total = 0;
    for (const state of game.planetaryBoard.planets.values()) {
      total += state.landingSlots.filter(
        (s) => s.playerId === player.id,
      ).length;
      if (!excludeMoons && state.moonOccupant?.playerId === player.id) {
        total += 1;
      }
    }
    return total >= count;
  };
}

/**
 * Check if a player has at least `count` total orbit + landing slots
 * across all planets (including moons).
 */
export function totalOrbitAndLand(count: number): TConditionFn {
  return (player, game) => {
    if (!game.planetaryBoard) return false;
    let total = 0;
    for (const state of game.planetaryBoard.planets.values()) {
      total += state.orbitSlots.filter((s) => s.playerId === player.id).length;
      total += state.landingSlots.filter(
        (s) => s.playerId === player.id,
      ).length;
      if (state.moonOccupant?.playerId === player.id) {
        total += 1;
      }
    }
    return total >= count;
  };
}

/**
 * Check if a player has a probe sitting on a comet space
 * in the solar system board.
 */
export function probeOnComet(): TConditionFn {
  return (player, game) => {
    if (!game.solarSystem) return false;
    return game.solarSystem.spaces.some(
      (space) =>
        space.elements.some(
          (el) => el.type === ESolarSystemElementType.COMET && el.amount > 0,
        ) && space.occupants.some((o) => o.playerId === player.id),
    );
  };
}

/**
 * Check if a player has at least `count` traces of a specific color (total across all aliens).
 */
export function hasTrace(color: ETrace, count = 1): TConditionFn {
  return (player) => (player.traces[color] ?? 0) >= count;
}

/**
 * Check if a player has at least 1 trace of the given color on EVERY
 * alien species in the game. Used for "on each species" mission cards
 * (e.g. ALICE: blue trace on each species → 2 data).
 */
export function hasTraceOnAllSpecies(color: ETrace): TConditionFn {
  return (player, game) => {
    const boards = game.alienState?.boards;
    if (!boards || boards.length === 0) return false;
    return boards.every((board) => {
      const alienTraces = player.tracesByAlien[board.alienIndex];
      return (alienTraces?.[color] ?? 0) >= 1;
    });
  };
}

/**
 * Check if a player's score is at least `minScore`.
 */
export function hasMinScore(minScore: number): TConditionFn {
  return (player) => player.score >= minScore;
}

/**
 * Check if a player's publicity is at least `minPublicity`.
 */
export function hasMinPublicity(minPublicity: number): TConditionFn {
  return (player) => player.publicity >= minPublicity;
}

/**
 * Check if a player has no cards in hand.
 */
export function hasNoCardsInHand(): TConditionFn {
  return (player) => player.hand.length === 0;
}

/**
 * Check if a player has a probe on an asteroid space adjacent to Earth.
 */
export function probeOnAsteroidAdjacentToEarth(): TConditionFn {
  return (player, game) => {
    const ss = game.solarSystem;
    if (!ss) return false;

    const earthSpaceIds = new Set(
      ss.spaces
        .filter((space) =>
          space.elements.some(
            (el) => el.type === ESolarSystemElementType.EARTH && el.amount > 0,
          ),
        )
        .map((space) => space.id),
    );

    if (earthSpaceIds.size === 0) return false;

    return ss.spaces.some((space) => {
      const hasPlayerProbe = space.occupants.some(
        (o) => o.playerId === player.id,
      );
      if (!hasPlayerProbe) return false;

      const hasAsteroid = space.elements.some(
        (el) => el.type === ESolarSystemElementType.ASTEROID && el.amount > 0,
      );
      if (!hasAsteroid) return false;

      const neighbors = ss.adjacency.get(space.id) ?? [];
      return neighbors.some((id) => earthSpaceIds.has(id));
    });
  };
}

/**
 * Check if a player has at least one red, yellow, and blue trace
 * on a single alien species.
 */
export function hasAllPrimaryTracesOnSingleSpecies(): TConditionFn {
  return (player, game) => {
    const boards = game.alienState?.boards;
    if (!boards || boards.length === 0) return false;

    return boards.some((board) => {
      const alienTraces = player.tracesByAlien[board.alienIndex];
      return (
        (alienTraces?.[ETrace.RED] ?? 0) >= 1 &&
        (alienTraces?.[ETrace.YELLOW] ?? 0) >= 1 &&
        (alienTraces?.[ETrace.BLUE] ?? 0) >= 1
      );
    });
  };
}

/**
 * Check if a player has at least `count` total orbit slots across all planets.
 */
export function totalOrbits(count: number): TConditionFn {
  return (player, game) => {
    if (!game.planetaryBoard) return false;
    let total = 0;
    for (const state of game.planetaryBoard.planets.values()) {
      total += state.orbitSlots.filter((s) => s.playerId === player.id).length;
    }
    return total >= count;
  };
}

/**
 * Check if a player has both an orbit and a landing at the same planet
 * (including moon occupant as landing).
 */
export function orbitAndLandAtSamePlanet(): TConditionFn {
  return (player, game) => {
    if (!game.planetaryBoard) return false;
    for (const state of game.planetaryBoard.planets.values()) {
      const hasOrbit = state.orbitSlots.some((s) => s.playerId === player.id);
      const hasLand =
        state.landingSlots.some((s) => s.playerId === player.id) ||
        state.moonOccupant?.playerId === player.id;
      if (hasOrbit && hasLand) return true;
    }
    return false;
  };
}

/**
 * Check if a player has a probe at least `minDistance` spaces from Earth
 * on the solar system board (BFS shortest path).
 */
export function probeMinDistanceFromEarth(minDistance: number): TConditionFn {
  return (player, game) => {
    if (!game.solarSystem) return false;
    const ss = game.solarSystem;

    const earthSpaceIds = new Set(
      ss.spaces
        .filter((sp) =>
          sp.elements.some(
            (el) => el.type === ESolarSystemElementType.EARTH && el.amount > 0,
          ),
        )
        .map((sp) => sp.id),
    );
    if (earthSpaceIds.size === 0) return false;

    const dist = new Map<string, number>();
    const queue: string[] = [];
    for (const id of earthSpaceIds) {
      dist.set(id, 0);
      queue.push(id);
    }

    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      const d = dist.get(cur)!;
      for (const neighbor of ss.adjacency.get(cur) ?? []) {
        if (!dist.has(neighbor)) {
          dist.set(neighbor, d + 1);
          queue.push(neighbor);
        }
      }
    }

    for (const space of ss.spaces) {
      if (!space.occupants.some((o) => o.playerId === player.id)) continue;
      const d = dist.get(space.id);
      if (d !== undefined && d >= minDistance) return true;
    }
    return false;
  };
}

/**
 * Check if a player has at least `count` played cards that share the same sector.
 */
export function playedCardsInSameSector(count: number): TConditionFn {
  return (player) => {
    const sectorCounts = new Map<string, number>();
    const allPlayed = [
      ...player.playedMissions,
      ...player.completedMissions,
      ...player.endGameCards,
    ];
    for (const item of allPlayed) {
      const sector =
        typeof item === 'string'
          ? undefined
          : (item as { sector?: string }).sector;
      if (!sector) continue;
      const prev = sectorCounts.get(sector) ?? 0;
      sectorCounts.set(sector, prev + 1);
      if (prev + 1 >= count) return true;
    }
    return false;
  };
}
