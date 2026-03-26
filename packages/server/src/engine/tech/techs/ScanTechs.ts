import { ETechId } from '@seti/common/types/tech';
import { Tech } from '../Tech.js';

/** Scan tech level 0: During Scan, may place signal in a sector adjacent to Earth instead of Earth's sector. */
export class ScanEarthLookTech extends Tech {
  public constructor() {
    super(ETechId.SCAN_EARTH_LOOK, 'Earth Look');
  }

  // TODO (Stage 2.5-2): override getScanModifiers
}

/** Scan tech level 1: Pay 1 publicity to place an extra signal in Mercury's sector during Scan. */
export class ScanPopSignalTech extends Tech {
  public constructor() {
    super(ETechId.SCAN_POP_SIGNAL, 'Pop Signal');
  }

  // TODO (Stage 2.5-2): override getScanModifiers
}

/** Scan tech level 2: Extra signal from discarding a hand card (by sector color). */
export class ScanHandSignalTech extends Tech {
  public constructor() {
    super(ETechId.SCAN_HAND_SIGNAL, 'Hand Signal');
  }

  // TODO (Stage 2.5-2): override getScanModifiers
}

/** Scan tech level 3: Pay 1 energy for a Launch effect, or gain 1 free movement. */
export class ScanEnergyLaunchTech extends Tech {
  public constructor() {
    super(ETechId.SCAN_ENERGY_LAUNCH, 'Energy Launch');
  }

  // TODO (Stage 2.5-2): override getScanModifiers
}
