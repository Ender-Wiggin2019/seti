import { vi } from 'vitest';
import { PlayCardAction } from '@/engine/actions/PlayCard.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createMockGame(): IGame {
  return {
    solarSystem: null,
    planetaryBoard: null,
    techBoard: null,
    sectors: [],
    mainDeck: { draw: () => undefined, discard: vi.fn() },
    cardRow: [],
    endOfRoundStacks: [],
    hiddenAliens: [],
    neutralMilestones: [],
    roundRotationReminderIndex: 0,
    hasRoundFirstPassOccurred: false,
    rotationCounter: 0,
  } as unknown as IGame;
}

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 4, energy: 3, publicity: 4 },
    hand: ['card-1', 'card-2'],
    ...overrides,
  });
}

describe('PlayCardAction', () => {
  describe('canExecute', () => {
    it('returns true when the hand has cards', () => {
      const game = createMockGame();
      const player = createPlayer();
      expect(PlayCardAction.canExecute(player, game)).toBe(true);
    });

    it('returns false when the hand is empty', () => {
      const game = createMockGame();
      const player = createPlayer({ hand: [] });
      expect(PlayCardAction.canExecute(player, game)).toBe(false);
    });
  });

  describe('execute', () => {
    it('removes the card at the given index from hand', () => {
      const game = createMockGame();
      const player = createPlayer();
      PlayCardAction.execute(player, game, 0);
      expect(player.hand).toEqual(['card-2']);
    });

    it('discards the played card via mainDeck.discard', () => {
      const game = createMockGame();
      const player = createPlayer();
      PlayCardAction.execute(player, game, 1);
      expect(game.mainDeck.discard).toHaveBeenCalledWith('card-2');
    });

    it('returns the played card id', () => {
      const game = createMockGame();
      const player = createPlayer();
      const result = PlayCardAction.execute(player, game, 0);
      expect(result.cardId).toBe('card-1');
    });

    it('throws when the hand is empty', () => {
      const game = createMockGame();
      const player = createPlayer({ hand: [] });
      expect(() => PlayCardAction.execute(player, game, 0)).toThrow();
    });

    it('throws when card index is out of range', () => {
      const game = createMockGame();
      const player = createPlayer();
      expect(() => PlayCardAction.execute(player, game, 2)).toThrow();
      expect(() => PlayCardAction.execute(player, game, -1)).toThrow();
    });
  });
});
