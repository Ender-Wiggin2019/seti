import { EFreeAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { Deck } from '@/engine/deck/Deck.js';
import { BuyCardFreeAction } from '@/engine/freeActions/BuyCard.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { stubTurnLockFields } from '../../helpers/stubTurnLock.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

const BUY_INTEGRATION_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createBuyIntegrationGame(seed: string): Game {
  const game = Game.create(
    BUY_INTEGRATION_PLAYERS,
    { playerCount: 2 },
    seed,
    seed,
  );
  resolveSetupTucks(game);
  return game;
}

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
    ...stubTurnLockFields(),
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
        ...stubTurnLockFields(),
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

  describe('Phase 3.5 — integration (Game.create + processFreeAction)', () => {
    it('3.5.1 [集成] costs 3 publicity via processFreeAction', () => {
      const game = createBuyIntegrationGame('buy-351-cost');
      const p1 = game.players[0];
      const pubBefore = p1.resources.publicity;
      expect(pubBefore).toBeGreaterThanOrEqual(3);

      game.processFreeAction(p1.id, {
        type: EFreeAction.BUY_CARD,
        fromDeck: true,
      });

      expect(p1.resources.publicity).toBe(pubBefore - 3);
    });

    it('3.5.2a [集成] can take a chosen card from the card row', () => {
      const game = createBuyIntegrationGame('buy-352-row');
      const p1 = game.players[0];
      const pick = game.cardRow[1];
      const targetId =
        pick === undefined
          ? ''
          : typeof pick === 'string'
            ? pick
            : String((pick as { id?: string }).id ?? '');
      expect(targetId).toBeTruthy();

      game.processFreeAction(p1.id, {
        type: EFreeAction.BUY_CARD,
        cardId: targetId,
      });

      expect(
        p1.hand.some((c) =>
          typeof c === 'string' ? c === targetId : c.id === targetId,
        ),
      ).toBe(true);
    });

    it('3.5.2b [集成] can take the top card of the deck', () => {
      const game = createBuyIntegrationGame('buy-352-deck');
      const p1 = game.players[0];
      const topBefore = game.mainDeck.peek(1)[0];

      game.processFreeAction(p1.id, {
        type: EFreeAction.BUY_CARD,
        fromDeck: true,
      });

      expect(
        p1.hand.some((c) =>
          typeof c === 'string' ? c === topBefore : c.id === topBefore,
        ),
      ).toBe(true);
    });

    it('3.5.3 [集成] refills the card row to 3 after taking from row', () => {
      const game = createBuyIntegrationGame('buy-353-refill');
      const p1 = game.players[0];
      expect(game.cardRow).toHaveLength(3);

      game.processFreeAction(p1.id, { type: EFreeAction.BUY_CARD });

      expect(game.cardRow).toHaveLength(3);
    });

    it('3.5.4 [集成] reshuffles discard when buying from an empty draw pile', () => {
      const game = createBuyIntegrationGame('buy-354-reshuffle');
      const p1 = game.players[0];
      game.mainDeck = new Deck<string>([], ['d1', 'd2', 'd3']);

      game.processFreeAction(p1.id, {
        type: EFreeAction.BUY_CARD,
        fromDeck: true,
      });

      expect(p1.hand.length).toBeGreaterThanOrEqual(1);
    });

    it('3.5E.1 [集成] publicity below 3 — canExecute false and processFreeAction throws', () => {
      const game = createBuyIntegrationGame('buy-35e1');
      const p1 = game.players[0];
      const spendPub = p1.resources.publicity - 2;
      if (spendPub > 0) {
        p1.resources.spend({ publicity: spendPub });
      }

      expect(BuyCardFreeAction.canExecute(p1, game)).toBe(false);
      expect(() =>
        game.processFreeAction(p1.id, { type: EFreeAction.BUY_CARD }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INSUFFICIENT_RESOURCES }),
      );
    });

    it('3.5E.2 [集成] empty card row and empty deck + discard — buy from row throws', () => {
      const game = createBuyIntegrationGame('buy-35e2');
      const p1 = game.players[0];
      game.cardRow.length = 0;
      game.mainDeck = new Deck<string>([], []);

      expect(() =>
        game.processFreeAction(p1.id, {
          type: EFreeAction.BUY_CARD,
          fromDeck: false,
        }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });
  });
});
