import { vi } from 'vitest';
import { PassAction } from '@/engine/actions/Pass.js';
import { BoardBuilder } from '@/engine/board/BoardBuilder.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createMockGame(overrides: Record<string, unknown> = {}): IGame {
  return {
    solarSystem: { rotateNextDisc: vi.fn().mockReturnValue(1) },
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
    it('sets player.passed to true', () => {
      const game = createMockGame();
      const player = createPlayer();
      expect(player.passed).toBe(false);
      PassAction.execute(player, game);
      expect(player.passed).toBe(true);
    });

    it('rotates the solar system on the first pass of the round', () => {
      const rng = new SeededRandom('pass-first-rotate');
      const solarSystem = BoardBuilder.buildSolarSystem(rng);
      const game = createMockGame({
        solarSystem,
        hasRoundFirstPassOccurred: false,
      });
      const player = createPlayer({ hand: [] });
      const result = PassAction.execute(player, game);
      expect(result.rotatedSolarSystem).toBe(true);
      expect(result.rotatedDisc).toBeGreaterThanOrEqual(0);
      expect(game.hasRoundFirstPassOccurred).toBe(true);
    });

    it('does not rotate the solar system on the second pass of the round', () => {
      const rng = new SeededRandom('pass-second-no-rotate');
      const solarSystem = BoardBuilder.buildSolarSystem(rng);
      const rotateSpy = vi.spyOn(solarSystem, 'rotateNextDisc');
      const game = createMockGame({
        solarSystem,
        hasRoundFirstPassOccurred: false,
      });
      PassAction.execute(createPlayer({ id: 'p1', hand: [] }), game);
      rotateSpy.mockClear();
      const result = PassAction.execute(
        createPlayer({ id: 'p2', seatIndex: 1, hand: [] }),
        game,
      );
      expect(rotateSpy).not.toHaveBeenCalled();
      expect(result.rotatedSolarSystem).toBe(false);
    });

    it('discards hand down when holding more than 4 cards', () => {
      const game = createMockGame({ endOfRoundStacks: [[]] });
      const player = createPlayer({
        hand: ['a', 'b', 'c', 'd', 'e', 'f'],
      });
      PassAction.execute(player, game);
      expect(player.hand.length).toBe(4);
    });

    it('picks an end-of-round card from the active stack', () => {
      const game = createMockGame();
      const player = createPlayer({ hand: [] });
      PassAction.execute(player, game);
      expect(player.hand).toContain('eor-1');
    });

    it('works with an empty hand', () => {
      const game = createMockGame();
      const player = createPlayer({ hand: [] });
      expect(() => PassAction.execute(player, game)).not.toThrow();
      expect(player.passed).toBe(true);
    });

    it('works when end-of-round stacks are empty', () => {
      const game = createMockGame({ endOfRoundStacks: [[]] });
      const player = createPlayer({ hand: [] });
      const result = PassAction.execute(player, game);
      expect(result.endOfRoundCardSelected).toBe(false);
      expect(player.hand).toEqual([]);
    });
  });
});
