import { EResource } from '@seti/common/types/element';
import { EFreeAction, EMainAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { Deck } from '@/engine/deck/Deck.js';
import { FreeActionCornerFreeAction } from '@/engine/freeActions/FreeActionCorner.js';
import { Game } from '@/engine/Game.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import type { Player } from '@/engine/player/Player.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createIntegrationGame(seed: string): Game {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  return game;
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

function setupCornerGame(
  seed: string,
  hand: TCardItem[],
): { game: Game; player: Player } {
  const game = createIntegrationGame(seed);
  const player = game.players[0] as Player;
  player.hand = [...hand];
  game.mainDeck = new Deck(['refill-1', 'refill-2'], []);
  return { game, player };
}

describe('FreeActionCornerFreeAction', () => {
  describe('canExecute', () => {
    it('returns true when player has cards', () => {
      const { game, player } = setupCornerGame('fac-can-1', ['a', 'b']);
      expect(FreeActionCornerFreeAction.canExecute(player, game)).toBe(true);
    });

    it('3.4E.1 returns false when hand is empty', () => {
      const { game, player } = setupCornerGame('fac-can-empty', []);
      expect(FreeActionCornerFreeAction.canExecute(player, game)).toBe(false);
    });
  });

  describe('execute (real Game + deck)', () => {
    it('discards the specified card from hand', () => {
      const { game, player } = setupCornerGame('fac-discard', [
        'card-a',
        'card-b',
        'card-c',
      ]);

      const result = FreeActionCornerFreeAction.execute(player, game, 'card-b');

      expect(result.discardedCardId).toBe('card-b');
      expect(player.hand.map(resolveCardId)).toEqual(['card-a', 'card-c']);
      expect(game.mainDeck.getDiscardPile()).toContain('card-b');
    });

    it('throws when card not found in hand', () => {
      const { game, player } = setupCornerGame('fac-missing', ['card-a']);

      expect(() =>
        FreeActionCornerFreeAction.execute(player, game, 'non-existent'),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });

    it('throws when hand is empty', () => {
      const { game, player } = setupCornerGame('fac-empty-ex', []);

      expect(() =>
        FreeActionCornerFreeAction.execute(player, game, 'card-a'),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });

    it('3.4.1 [集成] MOVE corner — discard grants +1 move (card 39)', () => {
      const { game, player } = setupCornerGame('fac-34-1-move', ['39']);
      const beforeMove = player.getMoveStash();

      FreeActionCornerFreeAction.execute(player, game, '39');

      expect(player.getMoveStash()).toBe(beforeMove + 1);
      expect(game.mainDeck.getDiscardPile()).toContain('39');
    });

    it('3.4.2 [集成] PUBLICITY corner — discard grants +1 publicity (card 68)', () => {
      const { game, player } = setupCornerGame('fac-34-2-pub', ['68']);
      const beforePublicity = player.resources.publicity;

      FreeActionCornerFreeAction.execute(player, game, '68');

      expect(player.resources.publicity).toBe(beforePublicity + 1);
      expect(game.mainDeck.getDiscardPile()).toContain('68');
    });

    it('3.4.3 [集成] DATA corner — discard grants +1 data (card 99)', () => {
      const { game, player } = setupCornerGame('fac-34-3-data', ['99']);
      const beforeData = player.resources.data;

      FreeActionCornerFreeAction.execute(player, game, '99');

      expect(player.resources.data).toBe(beforeData + 1);
      expect(game.mainDeck.getDiscardPile()).toContain('99');
    });
  });

  describe('Phase 3.4 / 3.4.6 — integration with mission triggers (Cornell 138)', () => {
    function expectCornellBranchPrompt(
      game: Game,
      player: Player,
      cornerCardId: string,
      expectedCompleteOptionId: string,
    ): void {
      player.hand = ['138', cornerCardId];
      game.mainDeck = new Deck(['refill-1', 'refill-2'], []);

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      expect(player.playedMissions.map(resolveCardId)).toEqual(['138']);

      game.processFreeAction(player.id, {
        type: EFreeAction.USE_CARD_CORNER,
        cardId: cornerCardId,
      });

      const prompt = player.waitingFor?.toModel() as
        | ISelectOptionInputModel
        | undefined;
      expect(prompt?.type).toBe(EPlayerInputType.OPTION);
      expect(prompt?.title).toBe('Mission triggered! Claim reward?');
      expect(
        prompt?.options.some(
          (option) => option.id === expectedCompleteOptionId,
        ),
      ).toBe(true);
      expect(game.mainDeck.getDiscardPile()).toContain(cornerCardId);
    }

    it('3.4.6a PUBLICITY corner triggers Cornell branch 0 (card 68)', () => {
      const game = createIntegrationGame('fac-346-pub');
      const player = game.players[0] as Player;
      expectCornellBranchPrompt(game, player, '68', 'complete-138-0');
    });

    it('3.4.6b DATA corner triggers Cornell branch 1 (card 99)', () => {
      const game = createIntegrationGame('fac-346-data');
      const player = game.players[0] as Player;
      expectCornellBranchPrompt(game, player, '99', 'complete-138-1');
    });

    it('3.4.6c MOVE corner triggers Cornell branch 2 (card 39)', () => {
      const game = createIntegrationGame('fac-346-move');
      const player = game.players[0] as Player;
      expectCornellBranchPrompt(game, player, '39', 'complete-138-2');
    });

    it('3.4.5 / 3.4E.2 does not let the same card be played as main action and discarded for corner', () => {
      const game = createIntegrationGame('fac-345-same-card');
      const player = game.players[0] as Player;
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

  describe('3.4E.1 processFreeAction rejects corner when hand is empty', () => {
    it('throws INVALID_ACTION', () => {
      const game = createIntegrationGame('fac-34e1');
      const player = game.players[0] as Player;
      player.hand = [];

      expect(() =>
        game.processFreeAction(player.id, {
          type: EFreeAction.USE_CARD_CORNER,
          cardId: '39',
        }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });
  });
});
