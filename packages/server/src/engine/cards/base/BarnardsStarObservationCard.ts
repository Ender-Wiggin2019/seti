import { EStarName } from '@seti/common/constant/sectorSetup';
import { ObservationEndGameCard } from './ObservationEndGameCard.js';

export class BarnardsStarObservationCard extends ObservationEndGameCard {
  public constructor() {
    super('38', EStarName.BARNARDS_STAR);
  }
}
