import { EPlanet } from '@seti/common/types/protocol/enums';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { orbitOrLandAt } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.10 — ODINUS Mission.
 * QUICK_MISSION: orbit or land at Neptune AND Uranus (incl. moons) → 5 VP + 1 card.
 */
export class OdinusMission extends MissionCard {
  public constructor() {
    super(loadCardData('10'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef(
      '10',
      (player, game) =>
        orbitOrLandAt(EPlanet.NEPTUNE)(player, game) &&
        orbitOrLandAt(EPlanet.URANUS)(player, game),
    );
  }
}
