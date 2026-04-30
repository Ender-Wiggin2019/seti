import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { hasMinPublicity } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.51 — Lovell Telescope.
 * QUICK_MISSION: have at least 8 publicity → 3 VP + 1 card.
 */
export class LovellTelescope extends MissionCard {
  public constructor() {
    super(loadCardData('51'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('51', hasMinPublicity(8));
  }
}
