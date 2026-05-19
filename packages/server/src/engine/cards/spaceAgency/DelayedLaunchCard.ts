import { buildMissionDefWithEventMatchers } from '@/engine/missions/buildMissionDef.js';
import {
  EMissionEventType,
  type IMissionDef,
} from '@/engine/missions/IMission.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = 'SA.33';

export class DelayedLaunch extends MissionCard {
  public constructor() {
    super(loadCardData(CARD_ID));
  }

  public override getMissionDef(): IMissionDef {
    return buildMissionDefWithEventMatchers(CARD_ID, [
      (event) => event.type === EMissionEventType.PASS,
    ]);
  }
}
