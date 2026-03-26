import { EndGameScoringCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

export class BarnardsStarObservation extends EndGameScoringCard {
  public constructor() {
    super(loadCardData('38'));
  }
}
