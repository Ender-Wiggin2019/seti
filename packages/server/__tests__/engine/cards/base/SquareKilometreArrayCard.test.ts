import { SquareKilometreArray } from '@/engine/cards/base/SquareKilometreArrayCard.js';

describe('SquareKilometreArray', () => {
  it('loads expected card metadata', () => {
    const card = new SquareKilometreArray();
    expect(card.id).toBe('50');
    expect(card.name.length).toBeGreaterThan(0);
  });
});
