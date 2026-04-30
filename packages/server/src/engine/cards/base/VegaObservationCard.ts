import { EStarName } from '@seti/common/constant/sectorSetup';
import { ObservationEndGameCard } from './ObservationEndGameCard.js';

export class VegaObservationCard extends ObservationEndGameCard {
  public constructor() {
    super('44', EStarName.VEGA);
  }
}
