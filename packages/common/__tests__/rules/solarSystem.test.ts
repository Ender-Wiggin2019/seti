import { describe, expect, it } from 'vitest';
import {
  findPlanetSpaceId,
  findSectorIndexByProbeId,
  getSpaceIdsInSector,
} from '../../src/rules/solarSystem';
import { EPlanet } from '../../src/types/protocol/enums';
import type { IPublicSolarSystemState } from '../../src/types/protocol/gameState';

function createSolarState(): IPublicSolarSystemState {
  return {
    spaces: ['space-0', 'space-1'],
    adjacency: {},
    probes: [{ playerId: 'p1', spaceId: 'space-0', probeId: 'probe-1' }],
    discs: [],
    spaceStates: {
      'space-0': {
        spaceId: 'space-0',
        ringIndex: 1,
        indexInRing: 0,
        sectorIndex: 0,
        cellInSector: 0,
        hasPublicityIcon: false,
        elementTypes: ['PLANET'],
        elements: [{ type: 'PLANET', planet: EPlanet.MARS }],
      },
      'space-1': {
        spaceId: 'space-1',
        ringIndex: 2,
        indexInRing: 2,
        sectorIndex: 1,
        cellInSector: 0,
        hasPublicityIcon: false,
        elementTypes: ['EMPTY'],
        elements: [{ type: 'EMPTY' }],
      },
    },
    alienTokens: [],
    planetSpaceIds: {},
    sectorSpaceIds: {},
    probeSpaceById: {},
  };
}

describe('solar system public-state helpers', () => {
  it('requires the current planetSpaceIds index for planet lookups', () => {
    const state = createSolarState();

    expect(findPlanetSpaceId(state, EPlanet.MARS)).toBeNull();

    state.planetSpaceIds = { [EPlanet.MARS]: 'space-0' };
    expect(findPlanetSpaceId(state, EPlanet.MARS)).toBe('space-0');
  });

  it('requires the current sectorSpaceIds index for sector space lookups', () => {
    const state = createSolarState();

    expect(getSpaceIdsInSector(state, 0)).toEqual([]);

    state.sectorSpaceIds = { 0: ['space-0'], 1: ['space-1'] };
    expect(getSpaceIdsInSector(state, 0)).toEqual(['space-0']);
  });

  it('requires the current probeSpaceById index for probe sector lookups', () => {
    const state = createSolarState();

    expect(findSectorIndexByProbeId(state, 'probe-1')).toBeNull();

    state.probeSpaceById = { 'probe-1': 'space-0' };
    expect(findSectorIndexByProbeId(state, 'probe-1')).toBe(0);
  });
});
