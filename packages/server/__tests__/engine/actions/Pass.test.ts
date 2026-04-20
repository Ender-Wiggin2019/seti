import { EFreeAction, EMainAction } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { PassAction } from '@/engine/actions/Pass.js';
import { BoardBuilder } from '@/engine/board/BoardBuilder.js';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createMockGame(overrides: Record<string, unknown> = {}): IGame {
  return {
    solarSystem: { rotateNextDisc: vi.fn().mockReturnValue(1) },
    alienState: { onSolarSystemRotated: vi.fn() },
    planetaryBoard: null,
    techBoard: null,
    sectors: [],
    mainDeck: { draw: () => undefined, discard: () => undefined },
    cardRow: [],
    endOfRoundStacks: [['eor-1', 'eor-2']],
    hiddenAliens: [],
    neutralMilestones: [],
    roundRotationReminderIndex: 0,
    hasRoundFirstPassOccurred: false,
    rotationCounter: 0,
    ...overrides,
  } as unknown as IGame;
}

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 4, energy: 3, publicity: 4 },
    ...overrides,
  });
}

const INTEGRATION_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createIntegrationGame(seed: string): {
  game: Game;
  player: Player;
  other: Player;
} {
  const game = Game.create(INTEGRATION_PLAYERS, { playerCount: 2 }, seed, seed);
  const player = game.players[0] as Player;
  const other = game.players[1] as Player;
  return { game, player, other };
}

function requireSolarSystem(game: Game): NonNullable<Game['solarSystem']> {
  if (!game.solarSystem) {
    throw new Error('expected solar system to be initialized');
  }
  return game.solarSystem;
}

function resolveEndOfRoundPick(
  game: Game,
  playerId: string,
): string | undefined {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player?.waitingFor) {
    return undefined;
  }

  const model = player.waitingFor.toModel() as {
    type: EPlayerInputType;
    cards?: Array<{ id: string }>;
  };
  if (model.type !== EPlayerInputType.END_OF_ROUND) {
    return undefined;
  }

  const pickedCardId = model.cards?.[0]?.id;
  if (!pickedCardId) {
    throw new Error('expected an end-of-round card to be available');
  }

  game.processInput(playerId, {
    type: EPlayerInputType.END_OF_ROUND,
    cardId: pickedCardId,
  });
  return pickedCardId;
}

describe('PassAction', () => {
  describe('canExecute', () => {
    it('always returns true', () => {
      const game = createMockGame();
      const player = createPlayer();
      expect(PassAction.canExecute(player, game)).toBe(true);
    });
  });

  describe('execute', () => {
    it('sets player.passed when no discard and no end-of-round stack', () => {
      const game = createMockGame({ endOfRoundStacks: [[]] });
      const player = createPlayer({ hand: [] });
      const input = PassAction.execute(player, game);
      expect(input).toBeUndefined();
      expect(player.passed).toBe(true);
    });

    it('rotates the solar system on the first pass of the round', () => {
      const rng = new SeededRandom('pass-first-rotate');
      const solarSystem = BoardBuilder.buildSolarSystemFromRandom(rng);
      const rotateSpy = vi.spyOn(solarSystem, 'rotateNextDisc');
      const game = createMockGame({
        solarSystem,
        hasRoundFirstPassOccurred: false,
        endOfRoundStacks: [['eor-1']],
      });
      const player = createPlayer({ hand: [] });

      const input = PassAction.execute(player, game);

      expect(rotateSpy).toHaveBeenCalledTimes(1);
      expect(game.hasRoundFirstPassOccurred).toBe(true);
      expect(input).toBeDefined();
      expect(input?.type).toBe(EPlayerInputType.END_OF_ROUND);
    });

    it('does not rotate the solar system on the second pass of the same round', () => {
      const rng = new SeededRandom('pass-second-no-rotate');
      const solarSystem = BoardBuilder.buildSolarSystemFromRandom(rng);
      const game = createMockGame({
        solarSystem,
        hasRoundFirstPassOccurred: false,
        endOfRoundStacks: [['eor-1', 'eor-2', 'eor-3']],
      });

      const p1 = createPlayer({ id: 'p1', hand: [] });
      const input1 = PassAction.execute(p1, game);
      input1?.process({
        type: EPlayerInputType.END_OF_ROUND,
        cardId: 'eor-1',
      });

      const rotateSpy = vi.spyOn(solarSystem, 'rotateNextDisc');
      const p2 = createPlayer({ id: 'p2', seatIndex: 1, hand: [] });
      PassAction.execute(p2, game);

      expect(rotateSpy).not.toHaveBeenCalled();
    });

    it('dispatches alien rotation hook after rotating', () => {
      const onSolarSystemRotated = vi.fn();
      const game = createMockGame({
        alienState: { onSolarSystemRotated },
        endOfRoundStacks: [[]],
      });
      const player = createPlayer({ hand: [] });

      PassAction.execute(player, game);

      expect(onSolarSystemRotated).toHaveBeenCalledTimes(1);
      expect(onSolarSystemRotated).toHaveBeenCalledWith(game);
    });

    it('does not dispatch the alien rotation hook on the second pass of the same round', () => {
      const onSolarSystemRotated = vi.fn();
      const game = createMockGame({
        alienState: { onSolarSystemRotated },
        endOfRoundStacks: [['eor-1', 'eor-2']],
      });

      const p1 = createPlayer({ id: 'p1', hand: [] });
      const firstInput = PassAction.execute(p1, game);
      firstInput?.process({
        type: EPlayerInputType.END_OF_ROUND,
        cardId: 'eor-1',
      });
      expect(onSolarSystemRotated).toHaveBeenCalledTimes(1);

      const p2 = createPlayer({ id: 'p2', seatIndex: 1, hand: [] });
      PassAction.execute(p2, game);

      expect(onSolarSystemRotated).toHaveBeenCalledTimes(1);
    });

    it('returns SelectCard when hand exceeds limit', () => {
      const game = createMockGame({ endOfRoundStacks: [[]] });
      const player = createPlayer({
        hand: ['a', 'b', 'c', 'd', 'e', 'f'],
      });
      const input = PassAction.execute(player, game);

      expect(input).toBeDefined();
      expect(input?.type).toBe(EPlayerInputType.CARD);

      const nextInput = input?.process({
        type: EPlayerInputType.CARD,
        cardIds: ['a', 'b'],
      });

      expect(player.hand.length).toBe(4);
      expect(nextInput).toBeUndefined();
      expect(player.passed).toBe(true);
    });

    it('chains discard → end-of-round card selection', () => {
      const game = createMockGame({
        endOfRoundStacks: [['eor-1', 'eor-2']],
      });
      const player = createPlayer({
        hand: ['a', 'b', 'c', 'd', 'e'],
      });
      const discardInput = PassAction.execute(player, game);

      expect(discardInput).toBeDefined();
      expect(discardInput?.type).toBe(EPlayerInputType.CARD);

      const eorInput = discardInput?.process({
        type: EPlayerInputType.CARD,
        cardIds: ['a'],
      });

      expect(player.hand.length).toBe(4);
      expect(eorInput).toBeDefined();
      expect(eorInput?.type).toBe(EPlayerInputType.END_OF_ROUND);

      const finalInput = eorInput?.process({
        type: EPlayerInputType.END_OF_ROUND,
        cardId: 'eor-2',
      });

      expect(finalInput).toBeUndefined();
      expect(player.passed).toBe(true);
      expect(player.hand).toContain('eor-2');
    });

    it('returns SelectEndOfRoundCard when stack is available', () => {
      const game = createMockGame();
      const player = createPlayer({ hand: [] });
      const input = PassAction.execute(player, game);

      expect(input).toBeDefined();
      expect(input?.type).toBe(EPlayerInputType.END_OF_ROUND);

      const nextInput = input?.process({
        type: EPlayerInputType.END_OF_ROUND,
        cardId: 'eor-1',
      });

      expect(nextInput).toBeUndefined();
      expect(player.passed).toBe(true);
      expect(player.hand).toContain('eor-1');
    });

    it('works with an empty hand and empty stack', () => {
      const game = createMockGame({ endOfRoundStacks: [[]] });
      const player = createPlayer({ hand: [] });
      const input = PassAction.execute(player, game);

      expect(input).toBeUndefined();
      expect(player.passed).toBe(true);
    });

    it('skips end-of-round card in the last round (no stack)', () => {
      const game = createMockGame({
        roundRotationReminderIndex: 4,
        endOfRoundStacks: [['a'], ['b'], ['c'], ['d']],
      });
      const player = createPlayer({ hand: [] });
      const input = PassAction.execute(player, game);

      expect(input).toBeUndefined();
      expect(player.passed).toBe(true);
      expect(player.hand).toEqual([]);
    });
  });
});

describe('PassAction — integration closure (2.8.x)', () => {
  it('2.8.1 allows a BUY_CARD free action immediately before PASS', () => {
    const { game, player, other } = createIntegrationGame(
      'pass-2-8-1-buy-pass',
    );
    player.hand = ['73', '98', '115'];
    game.cardRow = ['110', '55', '71'];
    game.mainDeck = new Deck(['refill-1'], []);
    const publicityBefore = player.resources.publicity;

    game.processFreeAction(player.id, {
      type: EFreeAction.BUY_CARD,
      cardId: '110',
      fromDeck: false,
    });

    expect(player.resources.publicity).toBe(publicityBefore - 3);
    expect(player.hand).toContain('110');

    game.processMainAction(player.id, { type: EMainAction.PASS });
    resolveEndOfRoundPick(game, player.id);

    expect(player.hand).toContain('110');
    expect(game.activePlayer.id).toBe(other.id);
    expect(game.phase).toBe('AWAIT_MAIN_ACTION');
  });

  it('2.8.1b BUY_CARD before PASS with hand >4 triggers the discard-down-to-4 branch', () => {
    // Same scenario as 2.8.1 but seeded so the player already holds 4
    // cards before the free action. BUY_CARD brings hand to 5, which is
    // above the 4-card pass limit → PASS must surface a CARD-discard
    // prompt first, then the end-of-round pick. The bought card is
    // eligible for discard (rule §5.8 does not pin its identity).
    const { game, player, other } = createIntegrationGame(
      'pass-2-8-1b-buy-then-discard',
    );
    player.hand = ['73', '98', '115', '90'];
    game.cardRow = ['110', '55', '71'];
    game.mainDeck = new Deck(['refill-1'], []);
    const publicityBefore = player.resources.publicity;

    game.processFreeAction(player.id, {
      type: EFreeAction.BUY_CARD,
      cardId: '110',
      fromDeck: false,
    });

    expect(player.resources.publicity).toBe(publicityBefore - 3);
    expect(player.hand).toHaveLength(5);
    expect(player.hand).toContain('110');

    game.processMainAction(player.id, { type: EMainAction.PASS });

    // PASS must first ask for a discard (hand is 5, limit is 4).
    const discardPrompt = player.waitingFor;
    expect(discardPrompt).toBeDefined();
    expect(discardPrompt!.toModel().type).toBe(EPlayerInputType.CARD);

    // Discard the just-bought card to prove that any card in hand is
    // eligible regardless of how it was acquired.
    game.processInput(player.id, {
      type: EPlayerInputType.CARD,
      cardIds: ['110'],
    });
    expect(player.hand).not.toContain('110');
    expect(player.hand).toHaveLength(4);

    // The chain now continues with the end-of-round pick.
    resolveEndOfRoundPick(game, player.id);

    expect(player.passed).toBe(true);
    expect(game.activePlayer.id).toBe(other.id);
    expect(game.phase).toBe('AWAIT_MAIN_ACTION');
  });

  it('2.8.4 first pass of round 5 still rotates the solar system even without end-of-round cards', () => {
    const { game, player, other } = createIntegrationGame(
      'pass-2-8-4-final-round-rotation',
    );
    game.round = 5;
    game.roundRotationReminderIndex = 4;
    player.hand = [];
    const solarSystem = requireSolarSystem(game);
    const rotationBefore = solarSystem.rotationCounter;

    game.processMainAction(player.id, { type: EMainAction.PASS });

    expect(solarSystem.rotationCounter).toBe(rotationBefore + 1);
    expect(player.waitingFor).toBeUndefined();
    expect(game.activePlayer.id).toBe(other.id);
    expect(game.phase).toBe('AWAIT_MAIN_ACTION');
  });

  it('2.8.5 the last passing player takes one card and leaves exactly one unclaimed in the stack', () => {
    const { game, player, other } = createIntegrationGame(
      'pass-2-8-5-last-player-stack-tail',
    );
    player.hand = [];
    other.hand = [];
    const stackIndex = game.roundRotationReminderIndex;
    const startingStackLength = game.endOfRoundStacks[stackIndex].length;

    const playerPick = () => {
      game.processMainAction(player.id, { type: EMainAction.PASS });
      return resolveEndOfRoundPick(game, player.id);
    };
    const otherPick = () => {
      game.processMainAction(other.id, { type: EMainAction.PASS });
      return resolveEndOfRoundPick(game, other.id);
    };

    const firstPick = playerPick();
    const secondPick = otherPick();

    expect(firstPick).toBeDefined();
    expect(secondPick).toBeDefined();
    expect(player.hand).toContain(firstPick);
    expect(other.hand).toContain(secondPick);
    expect(game.endOfRoundStacks[stackIndex]).toHaveLength(
      startingStackLength - 2,
    );
    expect(game.round).toBe(2);
  });
});
