import type { IPublicSolarSystemState } from '../types/protocol/gameState';

const BASE_MOVE_COST = 1;
const ASTEROID_EXTRA_COST = 1;
const SOLAR_ELEMENT_ASTEROID = 'ASTEROID';
const SOLAR_ELEMENT_SUN = 'SUN';

export interface IReachableSpace {
  spaceId: string;
  movementCost: number;
  path: string[];
}

export function getAdjacentSpaceIds(
  solarSystem: IPublicSolarSystemState,
  spaceId: string,
): string[] {
  return solarSystem.adjacency[spaceId] ?? [];
}

export function getMoveCost(
  solarSystem: IPublicSolarSystemState,
  fromSpaceId: string,
  toSpaceId: string,
): number {
  const adjacentSpaceIds = getAdjacentSpaceIds(solarSystem, fromSpaceId);
  if (!adjacentSpaceIds.includes(toSpaceId)) {
    return Number.POSITIVE_INFINITY;
  }

  const fromSpace = solarSystem.spaceStates?.[fromSpaceId];
  const toSpace = solarSystem.spaceStates?.[toSpaceId];
  if (
    toSpace?.elementTypes.includes(SOLAR_ELEMENT_SUN) ||
    fromSpace?.elementTypes.includes(SOLAR_ELEMENT_SUN)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const asteroidExtraCost = fromSpace?.elementTypes.includes(
    SOLAR_ELEMENT_ASTEROID,
  )
    ? ASTEROID_EXTRA_COST
    : 0;
  return BASE_MOVE_COST + asteroidExtraCost;
}

export function getMovePath(
  solarSystem: IPublicSolarSystemState,
  fromSpaceId: string,
  toSpaceId: string,
): string[] {
  if (fromSpaceId === toSpaceId) {
    return [fromSpaceId];
  }

  const distBySpace = new Map<string, number>([[fromSpaceId, 0]]);
  const prevBySpace = new Map<string, string>();
  const queue = new Set<string>([fromSpaceId]);

  while (queue.size > 0) {
    let currentSpaceId: string | null = null;
    let currentDist = Number.POSITIVE_INFINITY;
    for (const candidate of queue) {
      const candidateDist =
        distBySpace.get(candidate) ?? Number.POSITIVE_INFINITY;
      if (candidateDist < currentDist) {
        currentDist = candidateDist;
        currentSpaceId = candidate;
      }
    }

    if (currentSpaceId === null) {
      break;
    }
    queue.delete(currentSpaceId);

    if (currentSpaceId === toSpaceId) {
      break;
    }

    for (const neighborSpaceId of getAdjacentSpaceIds(
      solarSystem,
      currentSpaceId,
    )) {
      const edgeCost = getMoveCost(
        solarSystem,
        currentSpaceId,
        neighborSpaceId,
      );
      if (!Number.isFinite(edgeCost)) {
        continue;
      }

      const nextDist = currentDist + edgeCost;
      const knownDist =
        distBySpace.get(neighborSpaceId) ?? Number.POSITIVE_INFINITY;
      if (nextDist < knownDist) {
        distBySpace.set(neighborSpaceId, nextDist);
        prevBySpace.set(neighborSpaceId, currentSpaceId);
        queue.add(neighborSpaceId);
      }
    }
  }

  if (!distBySpace.has(toSpaceId)) {
    return [];
  }

  const path: string[] = [];
  let cursor: string | undefined = toSpaceId;
  while (cursor !== undefined) {
    path.push(cursor);
    cursor = prevBySpace.get(cursor);
  }
  path.reverse();

  return path[0] === fromSpaceId ? path : [];
}

export function getReachableSpaces(
  solarSystem: IPublicSolarSystemState,
  probeSpaceId: string,
  movementPoints: number,
): IReachableSpace[] {
  const distBySpace = new Map<string, number>([[probeSpaceId, 0]]);
  const prevBySpace = new Map<string, string>();
  const queue = new Set<string>([probeSpaceId]);

  while (queue.size > 0) {
    let currentSpaceId: string | null = null;
    let currentDist = Number.POSITIVE_INFINITY;
    for (const candidate of queue) {
      const candidateDist =
        distBySpace.get(candidate) ?? Number.POSITIVE_INFINITY;
      if (candidateDist < currentDist) {
        currentDist = candidateDist;
        currentSpaceId = candidate;
      }
    }

    if (currentSpaceId === null) {
      break;
    }
    queue.delete(currentSpaceId);

    for (const neighborSpaceId of getAdjacentSpaceIds(
      solarSystem,
      currentSpaceId,
    )) {
      const edgeCost = getMoveCost(
        solarSystem,
        currentSpaceId,
        neighborSpaceId,
      );
      if (!Number.isFinite(edgeCost)) {
        continue;
      }

      const nextDist = currentDist + edgeCost;
      if (nextDist > movementPoints) {
        continue;
      }

      const knownDist =
        distBySpace.get(neighborSpaceId) ?? Number.POSITIVE_INFINITY;
      if (nextDist < knownDist) {
        distBySpace.set(neighborSpaceId, nextDist);
        prevBySpace.set(neighborSpaceId, currentSpaceId);
        queue.add(neighborSpaceId);
      }
    }
  }

  const reachable: IReachableSpace[] = [];
  for (const [spaceId, movementCost] of distBySpace.entries()) {
    if (spaceId === probeSpaceId) {
      continue;
    }
    const path: string[] = [];
    let cursor: string | undefined = spaceId;
    while (cursor !== undefined) {
      path.push(cursor);
      cursor = prevBySpace.get(cursor);
    }
    path.reverse();

    reachable.push({
      spaceId,
      movementCost,
      path,
    });
  }

  return reachable.sort((left, right) => {
    if (left.movementCost !== right.movementCost) {
      return left.movementCost - right.movementCost;
    }
    return left.spaceId.localeCompare(right.spaceId);
  });
}
