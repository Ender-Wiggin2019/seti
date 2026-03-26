import { describe, expect, it } from 'vitest';
import {
  getAdjacentSpaceIds,
  getMoveCost,
  getMovePath,
  getReachableSpaces,
} from '@/rules/movement';
import type { IPublicSolarSystemState } from '@/types/protocol/gameState';

function createSolarSystem(): IPublicSolarSystemState {
  return {
    spaces: [],
    adjacency: {
      A: ['B', 'C'],
      B: ['A', 'D'],
      C: ['A'],
      D: ['B'],
    },
    probes: [],
    discs: [],
    spaceStates: {
      A: { elementTypes: [] },
      B: { elementTypes: [] },
      C: { elementTypes: ['ASTEROID'] },
      D: { elementTypes: [] },
    },
  } as unknown as IPublicSolarSystemState;
}

describe('getAdjacentSpaceIds', () => {
  it('returns neighbors', () => {
    const ss = createSolarSystem();
    expect(getAdjacentSpaceIds(ss, 'A')).toEqual(['B', 'C']);
  });

  it('returns empty for unknown space', () => {
    const ss = createSolarSystem();
    expect(getAdjacentSpaceIds(ss, 'Z')).toEqual([]);
  });
});

describe('getMoveCost', () => {
  it('returns 1 for normal move', () => {
    const ss = createSolarSystem();
    expect(getMoveCost(ss, 'A', 'B')).toBe(1);
  });

  it('returns 2 for move from asteroid space', () => {
    const ss = createSolarSystem();
    expect(getMoveCost(ss, 'C', 'A')).toBe(2);
  });

  it('returns Infinity for non-adjacent spaces', () => {
    const ss = createSolarSystem();
    expect(getMoveCost(ss, 'A', 'D')).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns Infinity for sun space', () => {
    const ss = createSolarSystem();
    (ss as any).spaceStates!['B'] = { elementTypes: ['SUN'] };
    expect(getMoveCost(ss, 'A', 'B')).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('getMovePath', () => {
  it('returns direct path for adjacent spaces', () => {
    const ss = createSolarSystem();
    const path = getMovePath(ss, 'A', 'B');
    expect(path).toEqual(['A', 'B']);
  });

  it('returns multi-hop path', () => {
    const ss = createSolarSystem();
    const path = getMovePath(ss, 'A', 'D');
    expect(path).toEqual(['A', 'B', 'D']);
  });

  it('returns self for same from/to', () => {
    const ss = createSolarSystem();
    const path = getMovePath(ss, 'A', 'A');
    expect(path).toEqual(['A']);
  });

  it('returns empty for unreachable destination', () => {
    const ss: IPublicSolarSystemState = {
      spaces: [],
      adjacency: { X: [], Y: [] },
      probes: [],
      discs: [],
      spaceStates: {
        X: { elementTypes: [] },
        Y: { elementTypes: [] },
      },
    } as unknown as IPublicSolarSystemState;
    expect(getMovePath(ss, 'X', 'Y')).toEqual([]);
  });
});

describe('getReachableSpaces', () => {
  it('returns spaces within movement budget', () => {
    const ss = createSolarSystem();
    const reachable = getReachableSpaces(ss, 'A', 1);
    const ids = reachable.map((r) => r.spaceId);
    expect(ids).toContain('B');
  });

  it('excludes start space', () => {
    const ss = createSolarSystem();
    const reachable = getReachableSpaces(ss, 'A', 3);
    const ids = reachable.map((r) => r.spaceId);
    expect(ids).not.toContain('A');
  });

  it('is sorted by cost then spaceId', () => {
    const ss = createSolarSystem();
    const reachable = getReachableSpaces(ss, 'A', 3);
    for (let i = 1; i < reachable.length; i++) {
      const prev = reachable[i - 1];
      const curr = reachable[i];
      if (prev.movementCost === curr.movementCost) {
        expect(prev.spaceId.localeCompare(curr.spaceId)).toBeLessThanOrEqual(0);
      } else {
        expect(prev.movementCost).toBeLessThan(curr.movementCost);
      }
    }
  });

  it('respects asteroid extra cost', () => {
    const ss = createSolarSystem();
    const reachable = getReachableSpaces(ss, 'A', 1);
    const asteroidNeighbor = reachable.find((r) => r.spaceId === 'C');
    expect(asteroidNeighbor).toBeDefined();
    expect(asteroidNeighbor!.movementCost).toBe(1);
  });
});
