import { ETrace } from '@seti/common/types/element';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { hasTrace } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.70 — ATLAS.
 * QUICK_MISSION: have 3 blue traces → 3 VP + 1 data.
 */
export class Atlas extends MissionCard {
  public constructor() {
    super(loadCardData('70'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('70', hasTrace(ETrace.BLUE, 3));
  }
}
