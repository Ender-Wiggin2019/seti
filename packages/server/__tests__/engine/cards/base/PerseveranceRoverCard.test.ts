import { PerseveranceRover } from '@/engine/cards/base/PerseveranceRoverCard.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('PerseveranceRover', () => {
  it('loads expected card id and kind', () => {
    const card = new PerseveranceRover();

    expect(card.id).toBe('13');
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
  });
});
