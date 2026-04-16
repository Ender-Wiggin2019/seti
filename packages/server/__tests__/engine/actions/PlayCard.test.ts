import { EMainAction, EPhase } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { PlayCardAction } from '@/engine/actions/PlayCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
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

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createIntegrationGame(seed: string) {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  const player = game.players.find((candidate) => candidate.id === 'p1');
  if (!player) {
    throw new Error('p1 not found');
  }
  return { game, player: player as Player };
}

function resolveUntilMissionPrompt(game: Game, player: Player): void {
  while (player.waitingFor) {
    const model = player.waitingFor.toModel() as {
      type: string;
      title?: string;
      options?: Array<{ id: string }>;
      cards?: Array<{ id: string }>;
    };

    if (model.title === 'Mission triggered! Claim reward?') {
      return;
    }

    if (model.type === EPlayerInputType.OPTION) {
      const doneOption = model.options?.find((option) => option.id === 'done');
      const selectedOptionId = doneOption?.id ?? model.options?.[0]?.id;
      if (!selectedOptionId) {
        throw new Error('expected option input to have at least one option');
      }
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: selectedOptionId,
      });
      continue;
    }

    if (model.type === EPlayerInputType.CARD) {
      const firstCardId = model.cards?.[0]?.id;
      if (!firstCardId) {
        throw new Error('expected card input to have at least one card');
      }
      game.processInput(player.id, {
        type: EPlayerInputType.CARD,
        cardIds: [firstCardId],
      });
      continue;
    }

    throw new Error(
      `unsupported input type while resolving test flow: ${model.type}`,
    );
  }
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

    it('integration: ordinary immediate cards pay their own cost, apply their effect, and go to discard', () => {
      const { game, player } = createIntegrationGame(
        'play-card-ordinary-immediate',
      );
      player.hand = ['110'];
      game.mainDeck = new Deck(['row-1', 'row-2'], ['old-discard']);
      game.cardRow = ['50', '55', '71'];
      const creditsBefore = player.resources.credits;
      const publicityBefore = player.resources.publicity;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      expect(player.hand).toEqual([]);
      expect(player.resources.credits).toBe(creditsBefore - 1);
      expect(player.resources.publicity).toBe(publicityBefore + 3);
      expect(game.mainDeck.getDiscardPile()).toEqual(['old-discard', '110']);
      expect(game.activePlayer.id).toBe('p2');
    });

    it('integration: launch-effect cards do not charge the normal launch action cost', () => {
      const { game, player } = createIntegrationGame(
        'play-card-launch-no-extra-cost',
      );
      player.hand = ['130'];
      player.resources.spend({
        credits: player.resources.credits - 1,
        energy: player.resources.energy,
      });
      game.mainDeck = new Deck(['row-1'], []);
      game.cardRow = ['50', '55', '71'];
      const creditsBefore = player.resources.credits;
      const energyBefore = player.resources.energy;
      const probesBefore = player.probesInSpace;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      expect(player.resources.credits).toBe(creditsBefore - 1);
      expect(player.resources.energy).toBe(energyBefore);
      expect(player.probesInSpace).toBe(probesBefore + 1);
      expect(game.mainDeck.getDiscardPile()).toEqual(['130']);
      expect(game.activePlayer.id).toBe('p2');
    });

    it('integration: insufficient resources rejects the play without mutating turn state', () => {
      const { game, player } = createIntegrationGame(
        'play-card-insufficient-resources',
      );
      player.hand = ['110'];
      player.resources.spend({ credits: player.resources.credits });
      const handBefore = [...player.hand];
      const activePlayerBefore = game.activePlayer.id;
      const phaseBefore = game.phase;
      const eventsBefore = game.eventLog.size();

      expect(() =>
        game.processMainAction(player.id, {
          type: EMainAction.PLAY_CARD,
          payload: { cardIndex: 0 },
        }),
      ).toThrow();

      expect(player.hand).toEqual(handBefore);
      expect(game.activePlayer.id).toBe(activePlayerBefore);
      expect(game.phase).toBe(phaseBefore);
      expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
      expect(game.eventLog.size()).toBe(eventsBefore);
    });

    it('integration: an already-satisfied quick mission prompts complete-or-skip before handoff', () => {
      const { game, player } = createIntegrationGame(
        'play-card-quick-mission-prompt',
      );
      player.hand = ['51'];
      player.resources.gain({ publicity: 4 });
      game.mainDeck = new Deck(['refill-1', 'reward-card'], []);

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      resolveUntilMissionPrompt(game, player);

      const missionPrompt = player.waitingFor?.toModel() as {
        type: string;
        title?: string;
        options?: Array<{ id: string }>;
      };

      expect(game.activePlayer.id).toBe('p1');
      expect(missionPrompt.type).toBe(EPlayerInputType.OPTION);
      expect(missionPrompt.title).toBe('Mission triggered! Claim reward?');
      expect(
        missionPrompt.options?.some((option) => option.id === 'complete-51-0'),
      ).toBe(true);
      expect(
        missionPrompt.options?.some((option) => option.id === 'skip-missions'),
      ).toBe(true);
    });

    it('integration: a full mission card does not trigger from its own play event', () => {
      const { game, player } = createIntegrationGame(
        'play-card-full-mission-self-trigger',
      );
      player.hand = ['106'];
      game.mainDeck = new Deck(['refill-1'], []);

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      expect(player.waitingFor).toBeUndefined();
      expect(game.activePlayer.id).toBe('p2');
      expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
      expect(
        game.missionTracker.getMissionState(player.id, '106'),
      ).toBeDefined();
      expect(player.playedMissions).toHaveLength(1);
    });
  });
});
