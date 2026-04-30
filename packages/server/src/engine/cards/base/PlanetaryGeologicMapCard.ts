import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { orbitAndLandAtSamePlanet } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.112 — Planetary Geologic Mapping.
 * QUICK_MISSION: orbit and land at a single planet → 3 VP + 1 data.
 */
export class PlanetaryGeologicMap extends MissionCard {
  public constructor() {
    super(loadCardData('112'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('112', orbitAndLandAtSamePlanet());
  }
}
