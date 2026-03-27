import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('FocusedResearch (card 71)', () => {
  it('loads expected card id and kind via registry', () => {
    const card = getCardRegistry().create('71');

    expect(card.id).toBe('71');
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
  });
});
