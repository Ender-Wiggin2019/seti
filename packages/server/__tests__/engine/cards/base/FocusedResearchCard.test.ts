import { FocusedResearch } from '@/engine/cards/base/FocusedResearchCard.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('FocusedResearch', () => {
  it('loads expected card id and kind', () => {
    const card = new FocusedResearch();

    expect(card.id).toBe('71');
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
  });
});
