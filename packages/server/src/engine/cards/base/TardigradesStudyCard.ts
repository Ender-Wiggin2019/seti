import { ETrace } from '@seti/common/types/element';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { hasTrace } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.96 — Tardigrades Study.
 * QUICK_MISSION: have 3 yellow traces → gain 1 yellow trace.
 */
export class TardigradesStudy extends MissionCard {
  public constructor() {
    super(loadCardData('96'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('96', hasTrace(ETrace.YELLOW, 3));
  }
}
