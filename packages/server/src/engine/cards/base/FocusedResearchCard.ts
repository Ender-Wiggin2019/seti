import { ImmediateCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

export class FocusedResearch extends ImmediateCard {
  public constructor() {
    super(loadCardData('71'));
  }
}
