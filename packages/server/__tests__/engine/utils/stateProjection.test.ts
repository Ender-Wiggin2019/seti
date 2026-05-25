import { SOLAR_SYSTEM_PLANETS } from '@seti/common/constant/boardLayout';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { SolarSystem } from '@/engine/board/SolarSystem.js';
import { toPublicSolarSystemState } from '@/engine/utils/stateProjection.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

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
          publicityIconAmount: 2,
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
    expect(state.spaceStates?.s2?.publicityIconAmount).toBe(2);
  });

  it.each<[string, [number, number, number]]>([
    ['unrotated', [0, 0, 0]],
    ['top disc rotated', [1, 0, 0]],
    ['middle disc rotated', [0, 2, 0]],
    ['all discs rotated', [1, 2, 3]],
    ['wraparound rotations', [7, 7, 7]],
  ])(
    'keeps real planet indexes and public space states aligned for %s',
    (_name, initialDiscAngles) => {
      const solarSystem = SolarSystem.init(new SeededRandom(_name), {
        initialDiscAngles,
      }).solarSystem;

      const state = toPublicSolarSystemState(solarSystem);

      expect(state.discs.map((disc) => disc.angle)).toEqual(initialDiscAngles);

      for (const planet of SOLAR_SYSTEM_PLANETS) {
        const location = solarSystem.getPlanetLocation(planet as EPlanet);
        expect(location).not.toBeNull();

        const publicSpaceId = state.planetSpaceIds?.[planet as EPlanet];
        expect(publicSpaceId).toBe(location?.space.id);

        const publicSpace = state.spaceStates[publicSpaceId ?? ''];
        expect(publicSpace?.elements).toContainEqual(
          expect.objectContaining({ planet }),
        );
      }
    },
  );
});
