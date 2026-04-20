import { EErrorCode } from '@seti/common/types/protocol/errors';
import { Deck } from '@/engine/deck/Deck.js';
import { BuyCardFreeAction } from '@/engine/freeActions/BuyCard.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createTestPlayer(overrides?: Record<string, unknown>): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 4, energy: 3, publicity: 5 },
    ...overrides,
  });
}

function createMockGame(
  cardRow: unknown[] = ['row-a', 'row-b', 'row-c'],
  deckCards: string[] = ['deck-1', 'deck-2', 'deck-3'],
): IGame {
  return {
    mainDeck: new Deck<string>(deckCards),
    cardRow: [...cardRow],
    random: new SeededRandom('test-buy'),
  } as unknown as IGame;
}

describe('BuyCardFreeAction', () => {
  describe('canExecute', () => {
    it('returns true with publicity >= 3', () => {
      const player = createTestPlayer();
      expect(BuyCardFreeAction.canExecute(player, createMockGame())).toBe(true);
    });

    it('returns false with publicity < 3', () => {
      const player = createTestPlayer({
        resources: { credits: 4, energy: 3, publicity: 2 },
      });
      expect(BuyCardFreeAction.canExecute(player, createMockGame())).toBe(
        false,
      );
    });
  });

  describe('execute — from row', () => {
    it('takes a specific card from the row and refills', () => {
      const player = createTestPlayer();
      const game = createMockGame();

      const result = BuyCardFreeAction.execute(player, game, {
        cardId: 'row-b',
      });

      expect(result.cardId).toBe('row-b');
      expect(result.source).toBe('row');
      expect(result.refilled).toBe(true);
      expect(player.hand).toContain('row-b');
      expect(player.resources.publicity).toBe(2);
      expect(game.cardRow).toHaveLength(3);
    });

    it('takes first card when no cardId specified', () => {
      const player = createTestPlayer();
      const game = createMockGame();

      const result = BuyCardFreeAction.execute(player, game, {});

      expect(result.cardId).toBe('row-a');
      expect(player.hand).toContain('row-a');
    });

    it('does not refill when deck is empty', () => {
      const player = createTestPlayer();
      const game = createMockGame(['row-a'], []);

      const result = BuyCardFreeAction.execute(player, game, {});

      expect(result.refilled).toBe(false);
      expect(game.cardRow).toHaveLength(0);
    });

    it('throws when card not in row', () => {
      const player = createTestPlayer();
      const game = createMockGame();

      expect(() =>
        BuyCardFreeAction.execute(player, game, { cardId: 'non-existent' }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });

    it('does not spend publicity when the selected row card is missing', () => {
      const player = createTestPlayer();
      const game = createMockGame();
      const publicityBefore = player.resources.publicity;

      expect(() =>
        BuyCardFreeAction.execute(player, game, { cardId: 'non-existent' }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
      expect(player.resources.publicity).toBe(publicityBefore);
    });
  });

  describe('execute — from deck', () => {
    it('draws from deck top', () => {
      const player = createTestPlayer();
      const game = createMockGame([], ['deck-1', 'deck-2']);

      const result = BuyCardFreeAction.execute(player, game, {
        fromDeck: true,
      });

      expect(result.source).toBe('deck');
      expect(result.cardId).toBe('deck-1');
      expect(player.hand).toContain('deck-1');
    });

    it('reshuffles discard if deck is empty', () => {
      const player = createTestPlayer();
      const deck = new Deck<string>([], ['discard-1', 'discard-2']);
      const game = {
        mainDeck: deck,
        cardRow: [],
        random: new SeededRandom('test-reshuffle'),
      } as unknown as IGame;

      const result = BuyCardFreeAction.execute(player, game, {
        fromDeck: true,
      });

      expect(result.source).toBe('deck');
      expect(player.hand).toHaveLength(1);
    });

    it('throws when deck and discard are both empty', () => {
      const player = createTestPlayer();
      const game = createMockGame([], []);

      expect(() =>
        BuyCardFreeAction.execute(player, game, { fromDeck: true }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });

    it('does not spend publicity when deck and discard are both empty', () => {
      const player = createTestPlayer();
      const game = createMockGame([], []);
      const publicityBefore = player.resources.publicity;

      expect(() =>
        BuyCardFreeAction.execute(player, game, { fromDeck: true }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
      expect(player.resources.publicity).toBe(publicityBefore);
    });
  });

  it('throws when publicity is insufficient', () => {
    const player = createTestPlayer({
      resources: { credits: 4, energy: 3, publicity: 2 },
    });
    const game = createMockGame();

    expect(() => BuyCardFreeAction.execute(player, game, {})).toThrowError(
      expect.objectContaining({ code: EErrorCode.INSUFFICIENT_RESOURCES }),
    );
  });
});
