import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { playedCardsInSameSector } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.103 — Westerbork Synthesis Radio Telescope.
 * QUICK_MISSION: have 2 played cards in the same sector → 9 VP.
 */
export class WesterborkTelescope extends MissionCard {
  public constructor() {
    super(loadCardData('103'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('103', playedCardsInSameSector(2));
  }
}
