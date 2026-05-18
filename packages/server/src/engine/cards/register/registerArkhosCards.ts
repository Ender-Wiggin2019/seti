import { arkhosCards } from '@seti/common/data/arkhosCards';
import { createGenericCard } from '../base/GenericCards.js';
import type { CardRegistry } from '../CardRegistry.js';
import { loadCardData } from '../loadCardData.js';

export function registerArkhosCards(registry: CardRegistry): void {
  for (const card of arkhosCards) {
    registry.register(card.id, () => createGenericCard(loadCardData(card.id)));
  }
}
