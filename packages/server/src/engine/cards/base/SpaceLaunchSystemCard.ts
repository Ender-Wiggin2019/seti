import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { totalLandings } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.31 — Space Launch System.
 * QUICK_MISSION: 3 total landings across all planets (moons excluded) → 1 credit.
 */
export class SpaceLaunchSystem extends MissionCard {
  public constructor() {
    super(loadCardData('31'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('31', totalLandings(3, true));
  }
}
