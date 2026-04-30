import { MainDeck } from '@/engine/deck/MainDeck.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

describe('MainDeck', () => {
  it('initializes with 80 default cards', () => {
    const deck = new MainDeck();
    expect(deck.drawSize).toBe(80);
  });

  it("has first card id 'card-1'", () => {
    const deck = new MainDeck();
    expect(deck.peek(1)[0]).toBe('card-1');
  });

  it("has last card id 'card-80' in the draw pile order", () => {
    const deck = new MainDeck();
    expect(deck.getDrawPile()[79]).toBe('card-80');
  });

  it('accepts custom card ids', () => {
    const deck = new MainDeck(['alpha', 'beta']);
    expect(deck.drawSize).toBe(2);
    expect(deck.draw()).toBe('alpha');
    expect(deck.draw()).toBe('beta');
  });

  it('inherits Deck operations (draw, discard, drawSize)', () => {
    const deck = new MainDeck(['a', 'b']);
    expect(deck.drawSize).toBe(2);
    deck.discard('x');
    expect(deck.discardSize).toBe(1);
    expect(deck.draw()).toBe('a');
    expect(deck.draw()).toBe('b');
    expect(deck.drawSize).toBe(0);
    const rng = new SeededRandom('deck-test');
    deck.reshuffleDiscards(rng);
    expect(deck.drawSize).toBe(1);
  });
});
