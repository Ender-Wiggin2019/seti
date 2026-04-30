import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { totalOrbitAndLand } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.132 — Space Shuttle.
 * QUICK_MISSION: have 5 total orbit + landing slots across all planets → 3 VP + 1 credit.
 */
export class SpaceShuttle extends MissionCard {
  public constructor() {
    super(loadCardData('132'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('132', totalOrbitAndLand(5));
  }
}
