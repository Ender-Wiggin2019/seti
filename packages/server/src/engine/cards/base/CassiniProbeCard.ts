import { EPlanet } from '@seti/common/types/protocol/enums';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { orbitOrLandAt } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.8 — Cassini Probe.
 * QUICK_MISSION: orbit or land at Saturn (incl. moons) → 6 VP + 1 publicity.
 */
export class CassiniProbe extends MissionCard {
  public constructor() {
    super(loadCardData('8'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('8', orbitOrLandAt(EPlanet.SATURN));
  }
}
