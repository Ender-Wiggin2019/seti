import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('BarnardsStarObservation (card 38)', () => {
  it('loads expected card id and kind via registry', () => {
    const card = getCardRegistry().create('38');

    expect(card.id).toBe('38');
    expect(card.kind).toBe(EServerCardKind.END_GAME);
  });
});
