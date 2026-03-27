import { ETrace } from '@seti/common/types/element';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { hasTrace } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.64 — ALICE.
 * QUICK_MISSION: for each blue trace species → 2 data.
 */
export class Alice extends MissionCard {
  public constructor() {
    super(loadCardData('64'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('64', hasTrace(ETrace.BLUE));
  }
}
