import { EErrorCode } from '@seti/common/types/protocol/errors';
import { EResource } from '@seti/common/types/element';
import { vi } from 'vitest';
import { Deck } from '@/engine/deck/Deck.js';
import { FreeActionCornerFreeAction } from '@/engine/freeActions/FreeActionCorner.js';
import type { IGame } from '@/engine/IGame.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import { Player } from '@/engine/player/Player.js';

function createTestPlayer(hand: TCardItem[] = ['card-a', 'card-b']): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    hand,
  });
}

function createMockGame(): IGame {
  return {
    mainDeck: new Deck<string>(),
    missionTracker: {
      recordEvent: vi.fn(),
    },
  } as unknown as IGame;
}

describe('FreeActionCornerFreeAction', () => {
  describe('canExecute', () => {
    it('returns true when player has cards', () => {
      const player = createTestPlayer();
      expect(
        FreeActionCornerFreeAction.canExecute(player, createMockGame()),
      ).toBe(true);
    });

    it('returns false when hand is empty', () => {
      const player = createTestPlayer([]);
      expect(
        FreeActionCornerFreeAction.canExecute(player, createMockGame()),
      ).toBe(false);
    });
  });

  describe('execute', () => {
    it('discards the specified card from hand', () => {
      const player = createTestPlayer(['card-a', 'card-b', 'card-c']);
      const game = createMockGame();

      const result = FreeActionCornerFreeAction.execute(player, game, 'card-b');

      expect(result.discardedCardId).toBe('card-b');
      expect(player.hand).toEqual(['card-a', 'card-c']);
      expect(game.mainDeck.getDiscardPile()).toContain('card-b');
    });

    it('throws when card not found in hand', () => {
      const player = createTestPlayer(['card-a']);
      const game = createMockGame();

      expect(() =>
        FreeActionCornerFreeAction.execute(player, game, 'non-existent'),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });

    it('throws when hand is empty', () => {
      const player = createTestPlayer([]);
      const game = createMockGame();

      expect(() =>
        FreeActionCornerFreeAction.execute(player, game, 'card-a'),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });

    it('executes free-action corner rewards from card data', () => {
      const player = createTestPlayer(['39']);
      const game = createMockGame();

      const beforeMove = player.getMoveStash();
      FreeActionCornerFreeAction.execute(player, game, '39');

      expect(player.getMoveStash()).toBe(beforeMove + 1);
      expect(game.missionTracker.recordEvent).toHaveBeenCalledWith({
        type: EMissionEventType.CARD_CORNER_USED,
        resourceType: EResource.MOVE,
      });
    });
  });
});
