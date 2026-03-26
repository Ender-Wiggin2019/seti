import { Deck } from '@/engine/deck/Deck.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

describe('Deck<T>', () => {
  const ITEMS = ['a', 'b', 'c', 'd', 'e'];

  describe('construction', () => {
    it('creates an empty deck by default', () => {
      const deck = new Deck<string>();
      expect(deck.drawSize).toBe(0);
      expect(deck.discardSize).toBe(0);
      expect(deck.isEmpty()).toBe(true);
    });

    it('initializes with provided items', () => {
      const deck = new Deck(ITEMS);
      expect(deck.drawSize).toBe(5);
      expect(deck.totalSize).toBe(5);
    });

    it('does not mutate the original array', () => {
      const original = [...ITEMS];
      const deck = new Deck(original);
      deck.draw();
      expect(original).toEqual(ITEMS);
    });
  });

  describe('draw', () => {
    it('draws from the top (front) of the draw pile', () => {
      const deck = new Deck(ITEMS);
      expect(deck.draw()).toBe('a');
      expect(deck.draw()).toBe('b');
      expect(deck.drawSize).toBe(3);
    });

    it('returns undefined when empty', () => {
      const deck = new Deck<string>();
      expect(deck.draw()).toBeUndefined();
    });
  });

  describe('drawOrThrow', () => {
    it('throws when deck is empty', () => {
      const deck = new Deck<string>();
      expect(() => deck.drawOrThrow()).toThrow();
    });

    it('returns an item when available', () => {
      const deck = new Deck(['x']);
      expect(deck.drawOrThrow()).toBe('x');
    });
  });

  describe('drawN', () => {
    it('draws requested number of items', () => {
      const deck = new Deck(ITEMS);
      const drawn = deck.drawN(3);
      expect(drawn).toEqual(['a', 'b', 'c']);
      expect(deck.drawSize).toBe(2);
    });

    it('draws all remaining if count exceeds size', () => {
      const deck = new Deck(['x', 'y']);
      const drawn = deck.drawN(5);
      expect(drawn).toEqual(['x', 'y']);
      expect(deck.isEmpty()).toBe(true);
    });
  });

  describe('peek', () => {
    it('returns top items without removing them', () => {
      const deck = new Deck(ITEMS);
      expect(deck.peek(2)).toEqual(['a', 'b']);
      expect(deck.drawSize).toBe(5);
    });
  });

  describe('addToTop / addToBottom', () => {
    it('addToTop places items at the front', () => {
      const deck = new Deck(['b']);
      deck.addToTop('a');
      expect(deck.draw()).toBe('a');
    });

    it('addToBottom places items at the back', () => {
      const deck = new Deck(['a']);
      deck.addToBottom('b');
      expect(deck.drawN(2)).toEqual(['a', 'b']);
    });
  });

  describe('discard', () => {
    it('adds items to the discard pile', () => {
      const deck = new Deck<string>();
      deck.discard('x', 'y');
      expect(deck.discardSize).toBe(2);
      expect(deck.drawSize).toBe(0);
    });
  });

  describe('shuffle', () => {
    it('produces deterministic results with seeded random', () => {
      const deck1 = new Deck(ITEMS);
      const deck2 = new Deck(ITEMS);
      deck1.shuffle(new SeededRandom('seed-42'));
      deck2.shuffle(new SeededRandom('seed-42'));
      expect(deck1.getDrawPile()).toEqual(deck2.getDrawPile());
    });

    it('produces different results with different seeds', () => {
      const deck1 = new Deck(ITEMS);
      const deck2 = new Deck(ITEMS);
      deck1.shuffle(new SeededRandom('seed-a'));
      deck2.shuffle(new SeededRandom('seed-b'));
      expect(deck1.getDrawPile()).not.toEqual(deck2.getDrawPile());
    });
  });

  describe('reshuffleDiscards', () => {
    it('moves discard pile into draw pile', () => {
      const deck = new Deck<string>();
      deck.discard('a', 'b', 'c');
      expect(deck.drawSize).toBe(0);
      deck.reshuffleDiscards(new SeededRandom('test'));
      expect(deck.drawSize).toBe(3);
      expect(deck.discardSize).toBe(0);
    });
  });

  describe('drawWithReshuffle', () => {
    it('auto-reshuffles when draw pile is empty', () => {
      const deck = new Deck<string>();
      deck.discard('a', 'b');
      const rng = new SeededRandom('auto');
      const item = deck.drawWithReshuffle(rng);
      expect(item).toBeDefined();
      expect(deck.totalSize).toBe(1);
    });

    it('returns undefined when both piles are empty', () => {
      const deck = new Deck<string>();
      expect(deck.drawWithReshuffle(new SeededRandom('x'))).toBeUndefined();
    });
  });
});
