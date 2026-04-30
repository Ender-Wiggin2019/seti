import { EPlanet } from '@seti/common/types/protocol/enums';
import { buildMissionDefWithEventMatchers } from '@/engine/missions/buildMissionDef.js';
import {
  EMissionEventType,
  type IMissionDef,
  type IMissionEvent,
} from '@/engine/missions/IMission.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

function isPlanetVisitExceptEarth(event: IMissionEvent): boolean {
  return (
    event.type === EMissionEventType.PROBE_VISITED_PLANET &&
    event.planet !== EPlanet.EARTH
  );
}

/**
 * Card No.128 — Advanced Navigation System.
 * FULL_MISSION: when visiting any non-Earth planet, choose one branch reward.
 */
export class AdvancedNavigationSystem extends MissionCard {
  public constructor() {
    super(loadCardData('128'));
  }

  public override getMissionDef(): IMissionDef {
    return buildMissionDefWithEventMatchers('128', [
      isPlanetVisitExceptEarth,
      isPlanetVisitExceptEarth,
      isPlanetVisitExceptEarth,
    ]);
  }
}
