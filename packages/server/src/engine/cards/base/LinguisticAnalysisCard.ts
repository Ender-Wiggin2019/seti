import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { hasAllPrimaryTracesOnSingleSpecies } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.102 — Linguistic Analysis.
 * QUICK_MISSION: have red + yellow + blue trace on a single species.
 */
export class LinguisticAnalysis extends MissionCard {
  public constructor() {
    super(loadCardData('102'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('102', hasAllPrimaryTracesOnSingleSpecies());
  }
}
