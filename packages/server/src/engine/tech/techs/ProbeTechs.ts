import { ETechId } from '@seti/common/types/tech';
import { Tech } from '../Tech.js';

/** Probe tech level 0: In-orbit probe limit raised from 1 to 2. */
export class ProbeDoubleProbeTech extends Tech {
  public constructor() {
    super(ETechId.PROBE_DOUBLE_PROBE, 'Double Probe');
  }

  public override modifyProbeSpaceLimit(currentLimit: number): number {
    return Math.max(currentLimit, 2);
  }
}

/** Probe tech level 1: Gain publicity on asteroid entry; ignore extra move cost to leave asteroid. */
export class ProbeAsteroidTech extends Tech {
  public constructor() {
    super(ETechId.PROBE_ASTEROID, 'Asteroid');
  }

  public override modifyAsteroidLeaveCost(currentCost: number): number {
    return Math.max(0, currentCost - 1);
  }

  public override grantsAsteroidPublicity(): boolean {
    return true;
  }
}

/** Probe tech level 2: Land action energy cost -1 (stacks with orbiter discount). */
export class ProbeRoverDiscountTech extends Tech {
  public constructor() {
    super(ETechId.PROBE_ROVER_DISCOUNT, 'Rover Discount');
  }

  public override modifyLandingCost(currentCost: number): number {
    return Math.max(0, currentCost - 1);
  }
}

/** Probe tech level 3: Allows landing on moons. */
export class ProbeMoonTech extends Tech {
  public constructor() {
    super(ETechId.PROBE_MOON, 'Moon Landing');
  }

  public override grantsMoonLanding(): boolean {
    return true;
  }
}
