import { ETechId } from '@seti/common/types/tech';
import { TechModifierQuery } from '@/engine/tech/TechModifierQuery.js';

describe('TechModifierQuery', () => {
  it('applies known probe modifiers from tech ids', () => {
    const query = TechModifierQuery.fromTechIds([
      ETechId.PROBE_DOUBLE_PROBE,
      ETechId.PROBE_ROVER_DISCOUNT,
    ]);

    expect(query.getProbeSpaceLimit(1)).toBe(2);
    expect(query.getLandingCost(3)).toBe(2);
  });

  it('reports moon landing capability', () => {
    const withoutMoon = TechModifierQuery.fromTechIds([]);
    const withMoon = TechModifierQuery.fromTechIds([ETechId.PROBE_MOON]);

    expect(withoutMoon.canLandOnMoon()).toBe(false);
    expect(withMoon.canLandOnMoon()).toBe(true);
  });
});
