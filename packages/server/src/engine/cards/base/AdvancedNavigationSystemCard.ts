import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

export class AdvancedNavigationSystem extends MissionCard {
  public constructor() {
    super(loadCardData('128'));
  }
}
