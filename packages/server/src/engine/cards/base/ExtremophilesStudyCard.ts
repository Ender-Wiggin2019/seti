import { ImmediateCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

export class ExtremophilesStudy extends ImmediateCard {
  public constructor() {
    super(loadCardData('75'));
  }
}
