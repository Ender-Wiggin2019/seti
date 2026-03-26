import { Deck } from './Deck.js';

/**
 * Placeholder alien deck. Will be populated with alien-specific cards
 * when the Alien expansion (Stage 8) is implemented.
 */
export class AlienDeck extends Deck<string> {
  public constructor(cardIds: readonly string[] = []) {
    super(cardIds);
  }
}
