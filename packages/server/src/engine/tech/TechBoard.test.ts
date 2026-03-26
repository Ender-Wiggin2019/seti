import { ETech } from '@seti/common/types/element';
import { ETechId, TECH_CATEGORIES, TECH_LEVELS } from '@seti/common/types/tech';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { TechBoard } from './TechBoard.js';

function createBoard(seed = 'test-seed'): TechBoard {
  return new TechBoard(new SeededRandom(seed));
}

describe('TechBoard', () => {
  describe('construction', () => {
    it('initializes 12 stacks with 4 tiles each', () => {
      const board = createBoard();
      expect(board.stacks.size).toBe(12);
      for (const stack of board.stacks.values()) {
        expect(stack.tiles).toHaveLength(4);
        expect(stack.firstTakeBonusAvailable).toBe(true);
      }
    });

    it('covers all category + level combinations', () => {
      const board = createBoard();
      for (const category of TECH_CATEGORIES) {
        for (const level of TECH_LEVELS) {
          const available = board.getAvailableTechs('any-player');
          const techIds = available.map((id) => id);
          expect(techIds.length).toBe(12);
        }
      }
    });
  });

  describe('canResearch', () => {
    it('returns true for any tech on a fresh board', () => {
      const board = createBoard();
      expect(board.canResearch('p1', ETechId.PROBE_DOUBLE_PROBE)).toBe(true);
      expect(board.canResearch('p1', ETechId.SCAN_POP_SIGNAL)).toBe(true);
      expect(board.canResearch('p1', ETechId.COMPUTER_VP_CARD)).toBe(true);
    });

    it('returns false if player already owns the tech', () => {
      const board = createBoard();
      board.take('p1', ETechId.PROBE_DOUBLE_PROBE);
      expect(board.canResearch('p1', ETechId.PROBE_DOUBLE_PROBE)).toBe(false);
    });

    it('allows different players to research the same tech', () => {
      const board = createBoard();
      board.take('p1', ETechId.PROBE_DOUBLE_PROBE);
      expect(board.canResearch('p2', ETechId.PROBE_DOUBLE_PROBE)).toBe(true);
    });

    it('returns false when stack is depleted', () => {
      const board = createBoard();
      board.take('p1', ETechId.PROBE_DOUBLE_PROBE);
      board.take('p2', ETechId.PROBE_DOUBLE_PROBE);
      board.take('p3', ETechId.PROBE_DOUBLE_PROBE);
      board.take('p4', ETechId.PROBE_DOUBLE_PROBE);
      expect(board.canResearch('p5', ETechId.PROBE_DOUBLE_PROBE)).toBe(false);
    });
  });

  describe('take', () => {
    it('removes a tile from the stack', () => {
      const board = createBoard();
      const stack = board.getStack(ETechId.SCAN_EARTH_LOOK)!;
      expect(stack.tiles).toHaveLength(4);

      board.take('p1', ETechId.SCAN_EARTH_LOOK);
      expect(stack.tiles).toHaveLength(3);
    });

    it('grants 2 VP first-take bonus on first take only', () => {
      const board = createBoard();
      const result1 = board.take('p1', ETechId.SCAN_EARTH_LOOK);
      expect(result1.vpBonus).toBe(2);

      const result2 = board.take('p2', ETechId.SCAN_EARTH_LOOK);
      expect(result2.vpBonus).toBe(0);
    });

    it('returns a tile with the correct tech', () => {
      const board = createBoard();
      const result = board.take('p1', ETechId.COMPUTER_VP_ENERGY);
      expect(result.tile.tech.id).toBe(ETechId.COMPUTER_VP_ENERGY);
      expect(result.tile.tech.type).toBe(ETech.COMPUTER);
      expect(result.tile.tech.level).toBe(1);
    });

    it('throws when player already owns the tech', () => {
      const board = createBoard();
      board.take('p1', ETechId.PROBE_ASTEROID);
      expect(() => board.take('p1', ETechId.PROBE_ASTEROID)).toThrow();
    });

    it('throws when stack is empty', () => {
      const board = createBoard();
      board.take('p1', ETechId.PROBE_MOON);
      board.take('p2', ETechId.PROBE_MOON);
      board.take('p3', ETechId.PROBE_MOON);
      board.take('p4', ETechId.PROBE_MOON);
      expect(() => board.take('p5', ETechId.PROBE_MOON)).toThrow();
    });
  });

  describe('getAvailableTechs', () => {
    it('returns all 12 for a fresh player', () => {
      const board = createBoard();
      expect(board.getAvailableTechs('p1')).toHaveLength(12);
    });

    it('excludes owned techs', () => {
      const board = createBoard();
      board.take('p1', ETechId.PROBE_DOUBLE_PROBE);
      board.take('p1', ETechId.SCAN_HAND_SIGNAL);
      const available = board.getAvailableTechs('p1');
      expect(available).toHaveLength(10);
      expect(available).not.toContain(ETechId.PROBE_DOUBLE_PROBE);
      expect(available).not.toContain(ETechId.SCAN_HAND_SIGNAL);
    });
  });

  describe('playerOwns / getPlayerTechs', () => {
    it('tracks ownership correctly', () => {
      const board = createBoard();
      expect(board.playerOwns('p1', ETechId.PROBE_DOUBLE_PROBE)).toBe(false);
      board.take('p1', ETechId.PROBE_DOUBLE_PROBE);
      expect(board.playerOwns('p1', ETechId.PROBE_DOUBLE_PROBE)).toBe(true);
      expect(board.getPlayerTechs('p1')).toEqual([ETechId.PROBE_DOUBLE_PROBE]);
    });
  });

  describe('toPublicState', () => {
    it('converts to the protocol-compatible public state', () => {
      const board = createBoard();
      board.take('p1', ETechId.PROBE_DOUBLE_PROBE);

      const publicState = board.toPublicState();
      expect(publicState.stacks).toHaveLength(12);

      const probeStack0 = publicState.stacks.find(
        (s) => s.tech === ETech.PROBE && s.level === 0,
      );
      expect(probeStack0).toBeDefined();
      expect(probeStack0!.remainingTiles).toBe(3);
      expect(probeStack0!.firstTakeBonusAvailable).toBe(false);

      const scanStack0 = publicState.stacks.find(
        (s) => s.tech === ETech.SCAN && s.level === 0,
      );
      expect(scanStack0).toBeDefined();
      expect(scanStack0!.remainingTiles).toBe(4);
      expect(scanStack0!.firstTakeBonusAvailable).toBe(true);
    });
  });

  describe('deterministic with same seed', () => {
    it('produces identical boards with the same seed', () => {
      const board1 = createBoard('same-seed');
      const board2 = createBoard('same-seed');
      const pub1 = board1.toPublicState();
      const pub2 = board2.toPublicState();
      expect(pub1).toEqual(pub2);
    });
  });
});
