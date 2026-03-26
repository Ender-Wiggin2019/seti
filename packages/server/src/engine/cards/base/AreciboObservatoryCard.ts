import { ImmediateCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

export class AreciboObservatory extends ImmediateCard {
  public constructor() {
    super(loadCardData('55'));
  }
}
