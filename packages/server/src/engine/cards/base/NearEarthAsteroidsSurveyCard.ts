import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { probeOnAsteroidAdjacentToEarth } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.95 — Near-Earth Asteroids Survey.
 * QUICK_MISSION: have a probe on asteroids adjacent to Earth.
 */
export class NearEarthAsteroidsSurvey extends MissionCard {
  public constructor() {
    super(loadCardData('95'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('95', probeOnAsteroidAdjacentToEarth());
  }
}
