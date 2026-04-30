import { EPlanet } from '@seti/common/types/protocol/enums';
import { vi } from 'vitest';
import {
  consumeProbeFromPlanet,
  syncProbeCountsForPlayer,
} from '@/engine/effects/probe/ProbeEffectUtils.js';

describe('ProbeEffectUtils', () => {
  it('syncProbeCountsForPlayer writes per-planet counts', () => {
    const game = {
      solarSystem: {
        getPlanetLocation: () => ({ space: { id: 's1' } }),
        getSpacesOnPlanet: () => [{ id: 's1' }],
        getProbesAt: () => [{ playerId: 'p1' }, { playerId: 'p2' }],
      },
      planetaryBoard: {
        setProbeCount: vi.fn(),
      },
    };

    syncProbeCountsForPlayer(game as never, 'p1');

    expect(game.planetaryBoard.setProbeCount).toHaveBeenCalled();
  });

  it('consumeProbeFromPlanet removes one matching probe', () => {
    const space = {
      occupants: [{ playerId: 'p2' }, { playerId: 'p1' }],
    };
    const game = {
      solarSystem: {
        getSpacesOnPlanet: (_planet: EPlanet) => [space],
      },
    };

    expect(consumeProbeFromPlanet(game as never, 'p1', EPlanet.MARS)).toBe(
      true,
    );
    expect(space.occupants).toEqual([{ playerId: 'p2' }]);
  });
});
