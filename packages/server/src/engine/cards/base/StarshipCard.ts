import { ImmediateCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.85 - Starship
 * effects: [e.LAUNCH(), e.ROTATE(), e.TECH_PROBE()]
 *
 * No bespoke logic needed here: all effects are already covered by the
 * generic behavior parser/executor and are executed without main-action costs.
 */
export class Starship extends ImmediateCard {
  public constructor() {
    super(loadCardData('85'));
  }
}
