import { EResource } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { Deck } from '@/engine/deck/Deck.js';
import { ExchangeResourcesFreeAction } from '@/engine/freeActions/ExchangeResources.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

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

function createMockGame(deckCards: string[] = ['deck-1', 'deck-2']): IGame {
  return {
    mainDeck: new Deck<string>(deckCards),
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
  });

  describe('execute — credit to card', () => {
    it('spends 2 credits and draws 1 card', () => {
      const player = createTestPlayer();
      const game = createMockGame(['new-card']);
      const initialCredits = player.resources.credits;
      const initialHandSize = player.hand.length;

      ExchangeResourcesFreeAction.execute(
        player,
        game,
        EResource.CREDIT,
        EResource.CARD,
      );

      expect(player.resources.credits).toBe(initialCredits - 2);
      expect(player.hand.length).toBe(initialHandSize + 1);
    });
  });

  describe('validation', () => {
    it('throws when from === to', () => {
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

    it('throws when not enough credits', () => {
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
  });
});
