import { EPlanet } from '@seti/common/types/protocol/enums';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { orbitOrLandAt } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.6 — Juno Probe.
 * QUICK_MISSION: orbit or land at Jupiter (incl. moons) → 7 VP + 1 publicity.
 */
export class JunoProbe extends MissionCard {
  public constructor() {
    super(loadCardData('6'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('6', orbitOrLandAt(EPlanet.JUPITER));
  }
}
