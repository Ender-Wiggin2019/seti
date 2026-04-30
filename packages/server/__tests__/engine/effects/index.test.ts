import * as effects from '@/engine/effects/index.js';

describe('effects/index exports', () => {
  it('re-exports major effect entry points', () => {
    expect(effects.ScanEffect).toBeDefined();
    expect(effects.LaunchProbeEffect).toBeDefined();
    expect(effects.ResearchTechEffect).toBeDefined();
    expect(effects.TechBonusEffect).toBeDefined();
  });
});
