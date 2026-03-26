import { ETechId } from '@seti/common/types/tech';
import { Tech } from '../Tech.js';

/** Probe tech level 0: In-orbit probe limit raised from 1 to 2. */
export class ProbeDoubleProbeTech extends Tech {
  public constructor() {
    super(ETechId.PROBE_DOUBLE_PROBE, 'Double Probe');
  }

  // TODO (Stage 2.5-1): override modifyProbeSpaceLimit
}

/** Probe tech level 1: Gain publicity on asteroid entry; ignore extra move cost to leave asteroid. */
export class ProbeAsteroidTech extends Tech {
  public constructor() {
    super(ETechId.PROBE_ASTEROID, 'Asteroid');
  }

  // TODO (Stage 2.5-1): override modifyAsteroidLeaveCost, grantsAsteroidPublicity
}

/** Probe tech level 2: Land action energy cost -1 (stacks with orbiter discount). */
export class ProbeRoverDiscountTech extends Tech {
  public constructor() {
    super(ETechId.PROBE_ROVER_DISCOUNT, 'Rover Discount');
  }

  // TODO (Stage 2.5-1): override modifyLandingCost
}

/** Probe tech level 3: Allows landing on moons. */
export class ProbeMoonTech extends Tech {
  public constructor() {
    super(ETechId.PROBE_MOON, 'Moon Landing');
  }

  // TODO (Stage 2.5-1): override grantsMoonLanding
}
