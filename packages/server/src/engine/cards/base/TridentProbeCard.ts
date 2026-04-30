import { EPlanet } from '@seti/common/types/protocol/enums';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { orbitOrLandAt } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.60 — Trident Probe.
 * QUICK_MISSION: orbit or land at Neptune (incl. moons) → 4 VP + 1 data.
 */
export class TridentProbe extends MissionCard {
  public constructor() {
    super(loadCardData('60'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('60', orbitOrLandAt(EPlanet.NEPTUNE));
  }
}
