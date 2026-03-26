import { ETechId } from '@seti/common/types/tech';
import {
  ScanEarthLookTech,
  ScanEnergyLaunchTech,
  ScanHandSignalTech,
  ScanPopSignalTech,
} from '@/engine/tech/techs/ScanTechs.js';

describe('Scan tech modifiers', () => {
  it('exposes earth neighbor scan modifier', () => {
    const tech = new ScanEarthLookTech();
    expect(tech.getScanModifiers()).toEqual([
      {
        techId: ETechId.SCAN_EARTH_LOOK,
        effectType: 'earth-neighbor',
        description:
          'During Scan, earth signal may be placed in a sector adjacent to earth.',
      },
    ]);
  });

  it('exposes mercury signal scan modifier', () => {
    const tech = new ScanPopSignalTech();
    expect(tech.getScanModifiers()).toEqual([
      {
        techId: ETechId.SCAN_POP_SIGNAL,
        effectType: 'mercury-signal',
        description:
          'Pay 1 publicity to place one extra signal in mercury sector.',
        cost: { publicity: 1 },
      },
    ]);
  });

  it('exposes hand signal scan modifier', () => {
    const tech = new ScanHandSignalTech();
    expect(tech.getScanModifiers()).toEqual([
      {
        techId: ETechId.SCAN_HAND_SIGNAL,
        effectType: 'hand-signal',
        description:
          'Discard one hand card, then place one signal in the discarded card sector.',
      },
    ]);
  });

  it('exposes energy launch scan modifier', () => {
    const tech = new ScanEnergyLaunchTech();
    expect(tech.getScanModifiers()).toEqual([
      {
        techId: ETechId.SCAN_ENERGY_LAUNCH,
        effectType: 'energy-launch',
        description:
          'Choose one: pay 1 energy to launch a probe, or gain 1 free movement.',
        cost: { energy: 1 },
      },
    ]);
  });
});
