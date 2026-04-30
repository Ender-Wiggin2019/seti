import {
  findPlayerProbes,
  findProbeAtSpace,
} from '@/engine/freeActions/probeUtils.js';

describe('probeUtils', () => {
  it('findPlayerProbes returns all probes of player', () => {
    const game = {
      solarSystem: {
        spaces: [
          { id: 's1', occupants: [{ id: 'a', playerId: 'p1' }] },
          { id: 's2', occupants: [{ id: 'b', playerId: 'p2' }] },
          { id: 's3', occupants: [{ id: 'c', playerId: 'p1' }] },
        ],
      },
    };

    const probes = findPlayerProbes(game as never, 'p1');
    expect(probes).toHaveLength(2);
    expect(probes.map((p) => p.spaceId)).toEqual(['s1', 's3']);
  });

  it('findProbeAtSpace returns matching probe', () => {
    const game = {
      solarSystem: {
        getProbesAt: () => [
          { id: 'a', playerId: 'p2' },
          { id: 'b', playerId: 'p1' },
        ],
      },
    };

    const probe = findProbeAtSpace(game as never, 'p1', 's1');
    expect(probe?.id).toBe('b');
  });
});
