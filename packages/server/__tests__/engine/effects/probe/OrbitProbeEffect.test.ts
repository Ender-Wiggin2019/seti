import { EPlanet } from '@seti/common/types/protocol/enums';
import { OrbitProbeEffect } from '@/engine/effects/probe/OrbitProbeEffect.js';

describe('OrbitProbeEffect', () => {
  it('cannot execute on earth', () => {
    const can = OrbitProbeEffect.canExecute(
      {} as never,
      {
        solarSystem: {},
        planetaryBoard: {},
      } as never,
      EPlanet.EARTH,
    );

    expect(can).toBe(false);
  });
});
