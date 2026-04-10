import { Dragonfly } from '@/engine/cards/base/DragonflyCard.js';

describe('Dragonfly', () => {
  it('loads expected card metadata', () => {
    const card = new Dragonfly();
    expect(card.id).toBe('16');
    expect(card.name.length).toBeGreaterThan(0);
  });
});
