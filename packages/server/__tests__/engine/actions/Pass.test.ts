import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { PassAction } from '@/engine/actions/Pass.js';
import { BoardBuilder } from '@/engine/board/BoardBuilder.js';
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
      expect(input!.type).toBe(EPlayerInputType.END_OF_ROUND);
    });

    it('rotates the solar system on the second pass of the round too', () => {
      const rng = new SeededRandom('pass-second-no-rotate');
      const solarSystem = BoardBuilder.buildSolarSystemFromRandom(rng);
      const game = createMockGame({
        solarSystem,
        hasRoundFirstPassOccurred: false,
        endOfRoundStacks: [['eor-1', 'eor-2', 'eor-3']],
      });

      const p1 = createPlayer({ id: 'p1', hand: [] });
      const input1 = PassAction.execute(p1, game);
      input1!.process({
        type: EPlayerInputType.END_OF_ROUND,
        cardId: 'eor-1',
      });

      const rotateSpy = vi.spyOn(solarSystem, 'rotateNextDisc');
      const p2 = createPlayer({ id: 'p2', seatIndex: 1, hand: [] });
      PassAction.execute(p2, game);

      expect(rotateSpy).toHaveBeenCalledTimes(1);
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

    it('returns SelectCard when hand exceeds limit', () => {
      const game = createMockGame({ endOfRoundStacks: [[]] });
      const player = createPlayer({
        hand: ['a', 'b', 'c', 'd', 'e', 'f'],
      });
      const input = PassAction.execute(player, game);

      expect(input).toBeDefined();
      expect(input!.type).toBe(EPlayerInputType.CARD);

      const nextInput = input!.process({
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
      expect(discardInput!.type).toBe(EPlayerInputType.CARD);

      const eorInput = discardInput!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['a'],
      });

      expect(player.hand.length).toBe(4);
      expect(eorInput).toBeDefined();
      expect(eorInput!.type).toBe(EPlayerInputType.END_OF_ROUND);

      const finalInput = eorInput!.process({
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
      expect(input!.type).toBe(EPlayerInputType.END_OF_ROUND);

      const nextInput = input!.process({
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
