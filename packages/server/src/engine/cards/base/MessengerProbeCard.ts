import { EPlanet } from '@seti/common/types/protocol/enums';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { orbitOrLandAt } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.7 — MESSENGER Probe.
 * QUICK_MISSION: orbit or land at Mercury → 7 VP + 1 publicity.
 */
export class MessengerProbe extends MissionCard {
  public constructor() {
    super(loadCardData('7'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('7', orbitOrLandAt(EPlanet.MERCURY));
  }
}
