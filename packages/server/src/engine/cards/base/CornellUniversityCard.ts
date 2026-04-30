import { EResource } from '@seti/common/types/element';
import { buildMissionDefWithEventMatchers } from '@/engine/missions/buildMissionDef.js';
import {
  EMissionEventType,
  type IMissionDef,
  type IMissionEvent,
} from '@/engine/missions/IMission.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

function isCardCornerResource(
  resourceType: EResource,
): (event: IMissionEvent) => boolean {
  return (event: IMissionEvent): boolean =>
    event.type === EMissionEventType.CARD_CORNER_USED &&
    event.resourceType === resourceType;
}

/**
 * Card No.138 — Cornell University.
 * FULL_MISSION: trigger by the discarded card corner resource type.
 */
export class CornellUniversity extends MissionCard {
  public constructor() {
    super(loadCardData('138'));
  }

  public override getMissionDef(): IMissionDef {
    return buildMissionDefWithEventMatchers('138', [
      isCardCornerResource(EResource.PUBLICITY),
      isCardCornerResource(EResource.DATA),
      isCardCornerResource(EResource.MOVE),
    ]);
  }
}
