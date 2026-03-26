import { EPlanet } from '@seti/common/types/protocol/enums';
import { LandProbeEffect } from '@/engine/effects/probe/LandProbeEffect.js';

describe('LandProbeEffect', () => {
  it('cannot execute on earth', () => {
    const can = LandProbeEffect.canExecute(
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
