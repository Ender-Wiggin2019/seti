import { PRELUDE_CARDS_BY_ID } from '@seti/common/data/preludeCards';
import type { IPreludeCard } from '@seti/common/types/prelude';

export class PreludeRegistry {
  public static get(cardId: string): IPreludeCard {
    const card = PRELUDE_CARDS_BY_ID[cardId];
    if (!card) {
      throw new Error(`Unknown Quick Start card ${cardId}`);
    }
    return card;
  }
}
