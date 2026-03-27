import { ETrace } from '@seti/common/types/element';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { hasTrace } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.66 — GMRT Telescope Construction.
 * QUICK_MISSION: for each red trace species → 2 VP + 1 energy.
 */
export class GmrtTelescope extends MissionCard {
  public constructor() {
    super(loadCardData('66'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('66', hasTrace(ETrace.RED));
  }
}
