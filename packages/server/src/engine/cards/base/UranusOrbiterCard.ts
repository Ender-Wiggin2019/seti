import { EPlanet } from '@seti/common/types/protocol/enums';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { orbitOrLandAt } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.58 — Uranus Orbiter and Probe.
 * QUICK_MISSION: orbit or land at Uranus (incl. moons) → 3 VP + 1 card.
 */
export class UranusOrbiter extends MissionCard {
  public constructor() {
    super(loadCardData('58'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('58', orbitOrLandAt(EPlanet.URANUS));
  }
}
