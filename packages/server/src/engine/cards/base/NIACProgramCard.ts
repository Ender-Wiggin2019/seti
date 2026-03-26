import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

export class NIACProgram extends MissionCard {
  public constructor() {
    super(loadCardData('89'));
  }
}
