import { EStarName } from '@seti/common/constant/sectorSetup';
import { ObservationEndGameCard } from './ObservationEndGameCard.js';

export class Kepler22ObservationCard extends ObservationEndGameCard {
  public constructor() {
    super('40', EStarName.KEPLER_22);
  }
}
