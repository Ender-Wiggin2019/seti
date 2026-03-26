import { Deck } from './Deck.js';

const DEFAULT_BASE_CARD_COUNT = 80;

/**
 * Main game deck containing all base-game cards.
 * Cards are represented as string IDs until the Card system (Stage 3) is built.
 */
export class MainDeck extends Deck<string> {
  public constructor(cardIds?: readonly string[]) {
    const ids =
      cardIds ??
      Array.from(
        { length: DEFAULT_BASE_CARD_COUNT },
        (_, i) => `card-${i + 1}`,
      );
    super(ids);
  }
}
