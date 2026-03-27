import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('OnsalaTelescopeConstruction (card 62)', () => {
  it('loads expected card id and kind via registry', () => {
    const card = getCardRegistry().create('62');

    expect(card.id).toBe('62');
    expect(card.kind).toBe(EServerCardKind.END_GAME);
  });
});
