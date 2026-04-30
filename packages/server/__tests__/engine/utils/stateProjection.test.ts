import { toPublicSolarSystemState } from '@/engine/utils/stateProjection.js';

describe('toPublicSolarSystemState', () => {
  it('projects adjacency, probes and disc state', () => {
    const solarSystem = {
      adjacency: new Map([
        ['s1', ['s2']],
        ['s2', ['s1']],
      ]),
      spaces: [
        {
          id: 's1',
          ringIndex: 1,
          indexInRing: 0,
          hasPublicityIcon: false,
          elements: [{ type: 'EARTH' }],
          occupants: [{ id: 'probe-1', playerId: 'p1' }],
        },
        {
          id: 's2',
          ringIndex: 1,
          indexInRing: 1,
          hasPublicityIcon: true,
          elements: [{ type: 'ASTEROID' }],
          occupants: [],
        },
      ],
      discs: [{ index: 0, currentRotation: 45 }],
    };

    const state = toPublicSolarSystemState(solarSystem as never);
    expect(state.spaces).toEqual(['s1', 's2']);
    expect(state.probes).toEqual([
      { playerId: 'p1', spaceId: 's1', probeId: 'probe-1' },
    ]);
    expect(state.movablePieces).toEqual([
      {
        pieceId: 'probe-1',
        pieceType: 'probe',
        playerId: 'p1',
        spaceId: 's1',
        movementTarget: { type: 'probe', id: 'probe-1' },
      },
    ]);
    expect(state.discs[0]).toEqual({ discIndex: 0, angle: 45 });
  });
});
