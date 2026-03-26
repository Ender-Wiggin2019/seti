import { EndGameScoringCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

export class OnsalaTelescopeConstruction extends EndGameScoringCard {
  public constructor() {
    super(loadCardData('62'));
  }
}
