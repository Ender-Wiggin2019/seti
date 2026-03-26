import { ImmediateCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

export class PerseveranceRover extends ImmediateCard {
  public constructor() {
    super(loadCardData('13'));
  }
}
