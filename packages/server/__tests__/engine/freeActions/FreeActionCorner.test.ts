import { EResource } from '@seti/common/types/element';
import { EFreeAction, EMainAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { Deck } from '@/engine/deck/Deck.js';
import { FreeActionCornerFreeAction } from '@/engine/freeActions/FreeActionCorner.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import { Player } from '@/engine/player/Player.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

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

function createIntegrationGame(seed: string): Game {
  return Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
}

function resolveCardId(card: string | { id?: string }): string | undefined {
  return typeof card === 'string' ? card : card.id;
}

function resolveAllInputs(game: Game, playerId: string): void {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`expected player ${playerId} to exist`);
  }

  while (player.waitingFor) {
    const model = player.waitingFor.toModel();

    if (model.type === EPlayerInputType.OPTION) {
      const options = model as ISelectOptionInputModel;
      game.processInput(playerId, {
        type: EPlayerInputType.OPTION,
        optionId: options.options[0].id,
      });
      continue;
    }

    if (model.type === EPlayerInputType.END_OF_ROUND) {
      const picker = model as ISelectEndOfRoundCardInputModel;
      game.processInput(playerId, {
        type: EPlayerInputType.END_OF_ROUND,
        cardId: picker.cards[0].id,
      });
      continue;
    }

    break;
  }
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

    it('executes publicity corner rewards from card data', () => {
      const player = createTestPlayer(['68']);
      const game = createMockGame();
      const beforePublicity = player.resources.publicity;

      FreeActionCornerFreeAction.execute(player, game, '68');

      expect(player.resources.publicity).toBe(beforePublicity + 1);
      expect(game.missionTracker.recordEvent).toHaveBeenCalledWith({
        type: EMissionEventType.CARD_CORNER_USED,
        resourceType: EResource.PUBLICITY,
      });
    });

    it('executes data corner rewards from card data', () => {
      const player = createTestPlayer(['99']);
      const game = createMockGame();
      const beforeData = player.resources.data;

      FreeActionCornerFreeAction.execute(player, game, '99');

      expect(player.resources.data).toBe(beforeData + 1);
      expect(game.missionTracker.recordEvent).toHaveBeenCalledWith({
        type: EMissionEventType.CARD_CORNER_USED,
        resourceType: EResource.DATA,
      });
    });
  });

  describe('integration with real game flow', () => {
    it('triggers the matching Cornell University mission branch from a real corner discard', () => {
      const game = createIntegrationGame('free-action-corner-cornell-trigger');
      const player = game.players[0];
      player.hand = ['138', '68'];
      game.mainDeck = new Deck(['refill-1', 'refill-2'], []);

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      expect(player.playedMissions.map(resolveCardId)).toEqual(['138']);

      game.processFreeAction(player.id, {
        type: EFreeAction.USE_CARD_CORNER,
        cardId: '68',
      });

      expect(player.resources.publicity).toBe(5);
      const prompt = player.waitingFor?.toModel() as
        | ISelectOptionInputModel
        | undefined;
      expect(prompt?.type).toBe(EPlayerInputType.OPTION);
      expect(prompt?.title).toBe('Mission triggered! Claim reward?');
      expect(
        prompt?.options.some((option) => option.id === 'complete-138-0'),
      ).toBe(true);
      expect(game.mainDeck.getDiscardPile()).toContain('68');
    });

    it('does not let the same card be both played and discarded for its corner effect', () => {
      const game = createIntegrationGame(
        'free-action-corner-same-card-blocked',
      );
      const player = game.players[0];
      player.hand = ['68'];
      game.mainDeck = new Deck(['refill-1'], []);

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveAllInputs(game, player.id);

      expect(player.hand.map(resolveCardId)).not.toContain('68');

      expect(() =>
        game.processFreeAction(player.id, {
          type: EFreeAction.USE_CARD_CORNER,
          cardId: '68',
        }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
      expect(player.playedMissions.map(resolveCardId)).not.toContain('68');
      expect(game.mainDeck.getDiscardPile()).not.toContain('68');
    });
  });
});
