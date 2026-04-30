import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { totalOrbits } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.111 — Roman Space Telescope.
 * QUICK_MISSION: have 2 total orbits across all planets → 2 data.
 */
export class RomanSpaceTelescope extends MissionCard {
  public constructor() {
    super(loadCardData('111'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('111', totalOrbits(2));
  }
}
