import { ETrace } from '@seti/common/types/element';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { hasTraceOnAllSpecies } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.97 — Apollo 11 Mission.
 * QUICK_MISSION: yellow trace on each species → 2 VP + 1 card.
 */
export class Apollo11Mission extends MissionCard {
  public constructor() {
    super(loadCardData('97'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('97', hasTraceOnAllSpecies(ETrace.YELLOW));
  }
}
