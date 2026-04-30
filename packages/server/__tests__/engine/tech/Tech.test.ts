import { ETechId } from '@seti/common/types/tech';
import { Tech } from '@/engine/tech/Tech.js';

class TestTech extends Tech {
  public constructor() {
    super(ETechId.PROBE_DOUBLE_PROBE, 'Test Tech');
  }
}

describe('Tech base class', () => {
  it('provides no-op defaults for modifiers', () => {
    const tech = new TestTech();

    expect(tech.modifyProbeSpaceLimit(1)).toBe(1);
    expect(tech.modifyAsteroidLeaveCost(2)).toBe(2);
    expect(tech.grantsAsteroidPublicity()).toBe(false);
    expect(tech.modifyLandingCost(3)).toBe(3);
    expect(tech.grantsMoonLanding()).toBe(false);
    expect(tech.getScanModifiers()).toEqual([]);
    expect(tech.getComputerSlotReward(0)).toBeUndefined();
  });
});
