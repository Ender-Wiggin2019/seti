import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';
import { hasSignalOrFulfillmentInEverySector } from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.42';

export class LofarArray extends MissionCard {
  public constructor() {
    super(loadCardData(CARD_ID));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef(CARD_ID, hasSignalOrFulfillmentInEverySector);
  }
}
