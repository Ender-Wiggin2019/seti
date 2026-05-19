import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = 'SA.16';

export class AstronautTrainingExperience extends MissionCard {
  public constructor() {
    super(loadCardData(CARD_ID));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef(CARD_ID, (player) => {
      return player.resources.publicity === 0;
    });
  }
}
