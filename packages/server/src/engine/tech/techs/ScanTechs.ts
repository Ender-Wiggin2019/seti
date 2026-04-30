import { ETechId } from '@seti/common/types/tech';
import type { IScanTechEffect } from '../ITech.js';
import { Tech } from '../Tech.js';

/** Scan tech level 0: During Scan, may place signal in a sector adjacent to Earth instead of Earth's sector. */
export class ScanEarthLookTech extends Tech {
  public constructor() {
    super(ETechId.SCAN_EARTH_LOOK, 'Earth Look');
  }

  public override getScanModifiers(): IScanTechEffect[] {
    return [
      {
        techId: this.id,
        effectType: 'earth-neighbor',
        description:
          'During Scan, earth signal may be placed in a sector adjacent to earth.',
      },
    ];
  }
}

/** Scan tech level 1: Pay 1 publicity to place an extra signal in Mercury's sector during Scan. */
export class ScanPopSignalTech extends Tech {
  public constructor() {
    super(ETechId.SCAN_POP_SIGNAL, 'Pop Signal');
  }

  public override getScanModifiers(): IScanTechEffect[] {
    return [
      {
        techId: this.id,
        effectType: 'mercury-signal',
        description:
          'Pay 1 publicity to place one extra signal in mercury sector.',
        cost: { publicity: 1 },
      },
    ];
  }
}

/** Scan tech level 2: Extra signal from discarding a hand card (by sector color). */
export class ScanHandSignalTech extends Tech {
  public constructor() {
    super(ETechId.SCAN_HAND_SIGNAL, 'Hand Signal');
  }

  public override getScanModifiers(): IScanTechEffect[] {
    return [
      {
        techId: this.id,
        effectType: 'hand-signal',
        description:
          'Discard one hand card, then place one signal in the discarded card sector.',
      },
    ];
  }
}

/** Scan tech level 3: Pay 1 energy for a Launch effect, or gain 1 free movement. */
export class ScanEnergyLaunchTech extends Tech {
  public constructor() {
    super(ETechId.SCAN_ENERGY_LAUNCH, 'Energy Launch');
  }

  public override getScanModifiers(): IScanTechEffect[] {
    return [
      {
        techId: this.id,
        effectType: 'energy-launch',
        description:
          'Choose one: pay 1 energy to launch a probe, or gain 1 free movement.',
        cost: { energy: 1 },
      },
    ];
  }
}
