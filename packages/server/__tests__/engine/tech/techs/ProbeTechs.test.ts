import {
  ProbeAsteroidTech,
  ProbeDoubleProbeTech,
  ProbeMoonTech,
  ProbeRoverDiscountTech,
} from '@/engine/tech/techs/ProbeTechs.js';

describe('ProbeTechs', () => {
  it('applies probe and landing modifiers', () => {
    expect(new ProbeDoubleProbeTech().modifyProbeSpaceLimit(1)).toBe(2);
    expect(new ProbeAsteroidTech().modifyAsteroidLeaveCost(1)).toBe(0);
    expect(new ProbeRoverDiscountTech().modifyLandingCost(3)).toBe(2);
    expect(new ProbeMoonTech().grantsMoonLanding()).toBe(true);
  });
});
