import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('ExtremophilesStudy (card 75)', () => {
  it('loads expected card id and kind via registry', () => {
    const card = getCardRegistry().create('75');

    expect(card.id).toBe('75');
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
  });
});
