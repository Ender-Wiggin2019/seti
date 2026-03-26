import { AlienDeck } from '@/engine/deck/AlienDeck.js';

describe('AlienDeck', () => {
  it('initializes with empty cards by default', () => {
    const deck = new AlienDeck();
    expect(deck.drawSize).toBe(0);
  });

  it('accepts custom card ids', () => {
    const deck = new AlienDeck(['alien-1', 'alien-2']);
    expect(deck.drawSize).toBe(2);
    expect(deck.draw()).toBe('alien-1');
  });
});
