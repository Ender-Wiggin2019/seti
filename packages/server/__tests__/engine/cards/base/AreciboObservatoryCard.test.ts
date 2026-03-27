import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('AreciboObservatory (card 55)', () => {
  it('loads expected card id and kind via registry', () => {
    const card = getCardRegistry().create('55');

    expect(card.id).toBe('55');
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
  });
});
