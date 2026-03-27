import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { hasMinScore } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.61 — Quantum Computer.
 * QUICK_MISSION: have at least 50 score → gain income.
 */
export class QuantumComputer extends MissionCard {
  public constructor() {
    super(loadCardData('61'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('61', hasMinScore(50));
  }
}
