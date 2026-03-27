import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('PerseveranceRover (card 13)', () => {
  it('loads expected card id and kind via registry', () => {
    const card = getCardRegistry().create('13');

    expect(card.id).toBe('13');
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
  });
});
