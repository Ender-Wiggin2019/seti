import { AreciboObservatory } from '@/engine/cards/base/AreciboObservatoryCard.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('AreciboObservatory', () => {
  it('loads expected card id and kind', () => {
    const card = new AreciboObservatory();

    expect(card.id).toBe('55');
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
  });
});
