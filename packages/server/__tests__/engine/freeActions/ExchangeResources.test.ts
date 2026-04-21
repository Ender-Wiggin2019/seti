import { EResource } from '@seti/common/types/element';
import { EFreeAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { Deck } from '@/engine/deck/Deck.js';
import { ExchangeResourcesFreeAction } from '@/engine/freeActions/ExchangeResources.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { stubTurnLockFields } from '../../helpers/stubTurnLock.js';

const EXCHANGE_INTEGRATION_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createExchangeIntegrationGame(seed: string): Game {
  return Game.create(
    EXCHANGE_INTEGRATION_PLAYERS,
    { playerCount: 2 },
    seed,
    seed,
  );
}

function createTestPlayer(overrides?: Record<string, unknown>): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 4, energy: 3, publicity: 4 },
    hand: ['card-a', 'card-b', 'card-c'],
    ...overrides,
  });
}

function createMockGame(
  deckCards: string[] = ['deck-1', 'deck-2'],
  cardRow: string[] = [],
): IGame {
  return {
    ...stubTurnLockFields(),
    mainDeck: new Deck<string>(deckCards),
    cardRow: [...cardRow],
    random: new SeededRandom('test-exchange'),
  } as unknown as IGame;
}

describe('ExchangeResourcesFreeAction', () => {
  describe('canExecute', () => {
    it('returns true with 2+ credits', () => {
      const player = createTestPlayer();
      expect(
        ExchangeResourcesFreeAction.canExecute(player, createMockGame()),
      ).toBe(true);
    });

    it('returns false when all below 2', () => {
      const player = createTestPlayer({
        resources: { credits: 1, energy: 1, publicity: 4 },
        hand: ['card-a'],
      });
      expect(
        ExchangeResourcesFreeAction.canExecute(player, createMockGame()),
      ).toBe(false);
    });
  });

  describe('execute — credit to energy', () => {
    it('spends 2 credits and gains 1 energy', () => {
      const player = createTestPlayer();
      const initialCredits = player.resources.credits;
      const initialEnergy = player.resources.energy;

      ExchangeResourcesFreeAction.execute(
        player,
        createMockGame(),
        EResource.CREDIT,
        EResource.ENERGY,
      );

      expect(player.resources.credits).toBe(initialCredits - 2);
      expect(player.resources.energy).toBe(initialEnergy + 1);
    });
  });

  describe('execute — energy to credit', () => {
    it('spends 2 energy and gains 1 credit', () => {
      const player = createTestPlayer();
      const initialCredits = player.resources.credits;
      const initialEnergy = player.resources.energy;

      ExchangeResourcesFreeAction.execute(
        player,
        createMockGame(),
        EResource.ENERGY,
        EResource.CREDIT,
      );

      expect(player.resources.energy).toBe(initialEnergy - 2);
      expect(player.resources.credits).toBe(initialCredits + 1);
    });
  });

  describe('execute — cards to credit', () => {
    it('discards 2 cards and gains 1 credit', () => {
      const player = createTestPlayer();
      const game = createMockGame();
      const initialCredits = player.resources.credits;
      const initialHandSize = player.hand.length;

      ExchangeResourcesFreeAction.execute(
        player,
        game,
        EResource.CARD,
        EResource.CREDIT,
      );

      expect(player.hand.length).toBe(initialHandSize - 2);
      expect(player.resources.credits).toBe(initialCredits + 1);
    });

    it('puts the spent cards into the deck discard pile', () => {
      const player = createTestPlayer();
      const game = createMockGame();

      ExchangeResourcesFreeAction.execute(
        player,
        game,
        EResource.CARD,
        EResource.CREDIT,
      );

      expect(game.mainDeck.getDiscardPile()).toEqual(['card-c', 'card-b']);
      expect(player.hand).toEqual(['card-a']);
    });
  });

  describe('execute — credit to card', () => {
    it('3.6.2a spends 2 credits and draws 1 card from deck when card row is empty', () => {
      const player = createTestPlayer();
      const game = createMockGame(['new-card'], []);
      const initialCredits = player.resources.credits;
      const initialHandSize = player.hand.length;

      ExchangeResourcesFreeAction.execute(
        player,
        game,
        EResource.CREDIT,
        EResource.CARD,
        { fromDeck: true },
      );

      expect(player.resources.credits).toBe(initialCredits - 2);
      expect(player.hand.length).toBe(initialHandSize + 1);
      expect(player.hand).toContain('new-card');
    });

    it('3.6.2b takes the leftmost card from the row when fromDeck is not true', () => {
      const player = createTestPlayer();
      const game = createMockGame(['deck-refill'], ['row-a', 'row-b']);

      ExchangeResourcesFreeAction.execute(
        player,
        game,
        EResource.CREDIT,
        EResource.CARD,
        { fromDeck: false },
      );

      expect(player.hand).toContain('row-a');
      expect(
        game.cardRow.map((c) => (typeof c === 'string' ? c : c.id)),
      ).toEqual(['row-b', 'deck-refill']);
    });

    it('with fromDeck true, draws from deck even if the card row is not empty', () => {
      const player = createTestPlayer();
      const game = createMockGame(['deck-top'], ['row-a']);

      ExchangeResourcesFreeAction.execute(
        player,
        game,
        EResource.CREDIT,
        EResource.CARD,
        { fromDeck: true },
      );

      expect(player.hand).toContain('deck-top');
      expect(game.cardRow).toEqual(['row-a']);
    });
  });

  describe('validation', () => {
    it('3.6E.2 [错误] throws when from === to', () => {
      const player = createTestPlayer();

      expect(() =>
        ExchangeResourcesFreeAction.execute(
          player,
          createMockGame(),
          EResource.CREDIT,
          EResource.CREDIT,
        ),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });

    it('throws for invalid resource type', () => {
      const player = createTestPlayer();

      expect(() =>
        ExchangeResourcesFreeAction.execute(
          player,
          createMockGame(),
          EResource.DATA,
          EResource.CREDIT,
        ),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });

    it('3.6E.1 [错误] throws when not enough credits', () => {
      const player = createTestPlayer({
        resources: { credits: 1, energy: 3, publicity: 4 },
      });

      expect(() =>
        ExchangeResourcesFreeAction.execute(
          player,
          createMockGame(),
          EResource.CREDIT,
          EResource.ENERGY,
        ),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INSUFFICIENT_RESOURCES }),
      );
    });

    it('throws when not enough cards', () => {
      const player = createTestPlayer({ hand: ['card-a'] });

      expect(() =>
        ExchangeResourcesFreeAction.execute(
          player,
          createMockGame(),
          EResource.CARD,
          EResource.CREDIT,
        ),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INSUFFICIENT_RESOURCES }),
      );
    });

    it('throws before spending when CARD output has no row or deck source', () => {
      const player = createTestPlayer();
      const game = createMockGame([], []);
      const creditsBefore = player.resources.credits;

      expect(() =>
        ExchangeResourcesFreeAction.execute(
          player,
          game,
          EResource.CREDIT,
          EResource.CARD,
        ),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
      expect(player.resources.credits).toBe(creditsBefore);
    });
  });

  describe('Phase 3.6 — integration (Game.create)', () => {
    it('3.6.1 [集成] 2 credits / 2 energy / 2 cards → 1 credit / 1 energy / 1 card (deck)', () => {
      const game = createExchangeIntegrationGame('ex-361-int');
      const p1 = game.players[0];
      const creditDelta = p1.resources.credits - 6;
      if (creditDelta > 0) {
        p1.resources.spend({ credits: creditDelta });
      } else if (creditDelta < 0) {
        p1.resources.gain({ credits: -creditDelta });
      }
      const energyDelta = p1.resources.energy - 6;
      if (energyDelta > 0) {
        p1.resources.spend({ energy: energyDelta });
      } else if (energyDelta < 0) {
        p1.resources.gain({ energy: -energyDelta });
      }
      p1.hand = ['h1', 'h2', 'h3'];

      const c0 = p1.resources.credits;
      game.processFreeAction(p1.id, {
        type: EFreeAction.EXCHANGE_RESOURCES,
        from: EResource.CREDIT,
        to: EResource.ENERGY,
      });
      expect(p1.resources.credits).toBe(c0 - 2);
      expect(p1.resources.energy).toBe(7);

      const e1 = p1.resources.energy;
      game.processFreeAction(p1.id, {
        type: EFreeAction.EXCHANGE_RESOURCES,
        from: EResource.ENERGY,
        to: EResource.CREDIT,
      });
      expect(p1.resources.energy).toBe(e1 - 2);

      const handSize = p1.hand.length;
      game.processFreeAction(p1.id, {
        type: EFreeAction.EXCHANGE_RESOURCES,
        from: EResource.CARD,
        to: EResource.CREDIT,
      });
      expect(p1.hand.length).toBe(handSize - 2);

      const top = game.mainDeck.peek(1)[0];
      expect(top).toBeDefined();
      game.processFreeAction(p1.id, {
        type: EFreeAction.EXCHANGE_RESOURCES,
        from: EResource.CREDIT,
        to: EResource.CARD,
        fromDeck: true,
      });
      expect(
        p1.hand.some((c) => (typeof c === 'string' ? c === top : c.id === top)),
      ).toBe(true);
    });

    it('3.6.3 [集成] same-type exchange is rejected via processFreeAction', () => {
      const game = createExchangeIntegrationGame('ex-363');
      const p1 = game.players[0];

      expect(() =>
        game.processFreeAction(p1.id, {
          type: EFreeAction.EXCHANGE_RESOURCES,
          from: EResource.CREDIT,
          to: EResource.CREDIT,
        }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });

    it('3.6E.1 [集成] not enough credits — canExecute false and execute throws', () => {
      const game = createExchangeIntegrationGame('ex-36e1');
      const p1 = game.players[0];
      const cSpend = p1.resources.credits - 1;
      if (cSpend > 0) {
        p1.resources.spend({ credits: cSpend });
      }
      const eSpend = p1.resources.energy - 1;
      if (eSpend > 0) {
        p1.resources.spend({ energy: eSpend });
      }
      p1.hand = ['only'];

      expect(ExchangeResourcesFreeAction.canExecute(p1, game)).toBe(false);
      expect(() =>
        game.processFreeAction(p1.id, {
          type: EFreeAction.EXCHANGE_RESOURCES,
          from: EResource.CREDIT,
          to: EResource.ENERGY,
        }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INSUFFICIENT_RESOURCES }),
      );
    });
  });
});
