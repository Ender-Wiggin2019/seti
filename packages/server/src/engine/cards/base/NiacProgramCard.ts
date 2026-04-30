import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { hasNoCardsInHand } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.89 — NIAC Program.
 * QUICK_MISSION: have no cards in hand → gain 1 card.
 */
export class NiacProgram extends MissionCard {
  public constructor() {
    super(loadCardData('89'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('89', hasNoCardsInHand());
  }
}
