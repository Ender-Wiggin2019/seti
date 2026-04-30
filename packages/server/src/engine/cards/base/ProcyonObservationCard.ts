import { EStarName } from '@seti/common/constant/sectorSetup';
import { ObservationEndGameCard } from './ObservationEndGameCard.js';

export class ProcyonObservationCard extends ObservationEndGameCard {
  public constructor() {
    super('42', EStarName.PROCYON);
  }
}
