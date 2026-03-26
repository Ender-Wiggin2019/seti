import { ETechId } from '@seti/common/types/tech';
import {
  ProbeAsteroidTech,
  ProbeDoubleProbeTech,
  ProbeMoonTech,
  ProbeRoverDiscountTech,
} from '@/engine/tech/techs/ProbeTechs.js';

describe('Probe tech modifiers', () => {
  it('raises probe space limit to 2 with double-probe tech', () => {
    const tech = new ProbeDoubleProbeTech();
    expect(tech.id).toBe(ETechId.PROBE_DOUBLE_PROBE);
    expect(tech.modifyProbeSpaceLimit(1)).toBe(2);
    expect(tech.modifyProbeSpaceLimit(2)).toBe(2);
  });

  it('removes asteroid leave surcharge and grants asteroid publicity', () => {
    const tech = new ProbeAsteroidTech();
    expect(tech.id).toBe(ETechId.PROBE_ASTEROID);
    expect(tech.modifyAsteroidLeaveCost(1)).toBe(0);
    expect(tech.grantsAsteroidPublicity()).toBe(true);
  });

  it('reduces landing cost by 1 with rover discount tech', () => {
    const tech = new ProbeRoverDiscountTech();
    expect(tech.id).toBe(ETechId.PROBE_ROVER_DISCOUNT);
    expect(tech.modifyLandingCost(3)).toBe(2);
    expect(tech.modifyLandingCost(2)).toBe(1);
  });

  it('enables moon landing with probe moon tech', () => {
    const tech = new ProbeMoonTech();
    expect(tech.id).toBe(ETechId.PROBE_MOON);
    expect(tech.grantsMoonLanding()).toBe(true);
  });
});
