import { ImmediateCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

export class NotAPlanetSince2006Card extends ImmediateCard {
  public constructor() {
    // SE EN 01 is intentionally disabled in server runtime per current rule scope.
    // Keep it creatable from shared card data, but suppress its DESC custom token.
    super(loadCardData('SE EN 01'), { behavior: {} });
  }
}
