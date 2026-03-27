import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { probeMinDistanceFromEarth } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.87 — Project Longshot.
 * QUICK_MISSION: have a probe at least 5 spaces from Earth → 3 VP + 1 energy.
 */
export class ProjectLongshot extends MissionCard {
  public constructor() {
    super(loadCardData('87'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('87', probeMinDistanceFromEarth(5));
  }
}
