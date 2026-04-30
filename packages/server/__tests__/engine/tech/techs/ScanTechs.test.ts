import {
  ScanEarthLookTech,
  ScanEnergyLaunchTech,
  ScanHandSignalTech,
  ScanPopSignalTech,
} from '@/engine/tech/techs/ScanTechs.js';

describe('ScanTechs', () => {
  it('exposes one scan modifier per tech', () => {
    expect(new ScanEarthLookTech().getScanModifiers()[0]?.effectType).toBe(
      'earth-neighbor',
    );
    expect(new ScanPopSignalTech().getScanModifiers()[0]?.effectType).toBe(
      'mercury-signal',
    );
    expect(new ScanHandSignalTech().getScanModifiers()[0]?.effectType).toBe(
      'hand-signal',
    );
    expect(new ScanEnergyLaunchTech().getScanModifiers()[0]?.effectType).toBe(
      'energy-launch',
    );
  });
});
