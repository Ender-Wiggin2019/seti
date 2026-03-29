import { ETrace } from '@seti/common/types/element';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { hasTrace } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.105 — Green Bank Telescope.
 * QUICK_MISSION: have 3 red traces → gain 1 red trace.
 */
export class GreenBankTelescope extends MissionCard {
  public constructor() {
    super(loadCardData('105'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('105', hasTrace(ETrace.RED, 3));
  }
}
