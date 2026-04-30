import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('NIACProgram (card 89)', () => {
  it('loads expected card id and kind via registry', () => {
    const card = getCardRegistry().create('89');

    expect(card.id).toBe('89');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });
});
