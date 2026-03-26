import { describe, expect, it } from 'vitest';
import {
  getComputerPlacedCount,
  getNextSlot,
  getUnlockedBottomIndices,
  isComputerFull,
  isComputerTopRowFull,
} from '@/rules/computer';
import type { IPublicComputerState } from '@/types/protocol/gameState';
import { ETechId } from '@/types/tech';

function createComputer(
  overrides?: Partial<IPublicComputerState>,
): IPublicComputerState {
  return {
    topSlots: [null, null, null],
    bottomSlots: [],
    ...overrides,
  };
}

describe('computer rules', () => {
  describe('getUnlockedBottomIndices', () => {
    it('returns empty set when player has no computer techs', () => {
      const result = getUnlockedBottomIndices([ETechId.PROBE_DOUBLE_PROBE]);
      expect(result.size).toBe(0);
    });

    it('returns level indices for owned computer techs', () => {
      const result = getUnlockedBottomIndices([
        ETechId.COMPUTER_VP_CREDIT,
        ETechId.COMPUTER_VP_CARD,
      ]);
      expect(result).toEqual(new Set([0, 2]));
    });

    it('ignores non-computer techs', () => {
      const result = getUnlockedBottomIndices([
        ETechId.SCAN_EARTH_LOOK,
        ETechId.COMPUTER_VP_ENERGY,
      ]);
      expect(result).toEqual(new Set([1]));
    });
  });

  describe('getNextSlot', () => {
    it('returns top row index 0 when all empty', () => {
      const slot = getNextSlot(createComputer());
      expect(slot).toEqual({ row: 'top', index: 0 });
    });

    it('returns next unfilled top slot', () => {
      const slot = getNextSlot(
        createComputer({ topSlots: ['d1', null, null] }),
      );
      expect(slot).toEqual({ row: 'top', index: 1 });
    });

    it('returns bottom row when top is full and bottom has space (no techs filter)', () => {
      const slot = getNextSlot(
        createComputer({
          topSlots: ['d1', 'd2', 'd3'],
          bottomSlots: [null, null],
        }),
      );
      expect(slot).toEqual({ row: 'bottom', index: 0 });
    });

    it('returns null when fully occupied', () => {
      const slot = getNextSlot(
        createComputer({
          topSlots: ['d1', 'd2', 'd3'],
          bottomSlots: ['d4', 'd5'],
        }),
      );
      expect(slot).toBeNull();
    });

    it('returns null when top is full and no bottom slots', () => {
      const slot = getNextSlot(
        createComputer({
          topSlots: ['d1', 'd2', 'd3'],
          bottomSlots: [],
        }),
      );
      expect(slot).toBeNull();
    });

    it('skips bottom slot if corresponding top slot is empty', () => {
      const slot = getNextSlot(
        createComputer({
          topSlots: ['d1', null, null],
          bottomSlots: [null, null],
        }),
      );
      expect(slot).toEqual({ row: 'top', index: 1 });
    });
  });

  describe('getNextSlot with techs filter', () => {
    it('returns bottom slot only for tech-unlocked columns', () => {
      const slot = getNextSlot(
        createComputer({
          topSlots: ['d1', 'd2', 'd3'],
          bottomSlots: [null, null, null],
        }),
        [ETechId.COMPUTER_VP_ENERGY],
      );
      expect(slot).toEqual({ row: 'bottom', index: 1 });
    });

    it('returns null if no bottom slots are tech-unlocked', () => {
      const slot = getNextSlot(
        createComputer({
          topSlots: ['d1', 'd2', 'd3'],
          bottomSlots: [null, null, null],
        }),
        [ETechId.PROBE_DOUBLE_PROBE],
      );
      expect(slot).toBeNull();
    });

    it('skips filled bottom slots even if tech-unlocked', () => {
      const slot = getNextSlot(
        createComputer({
          topSlots: ['d1', 'd2', 'd3'],
          bottomSlots: ['d4', null, null],
        }),
        [ETechId.COMPUTER_VP_CREDIT, ETechId.COMPUTER_VP_CARD],
      );
      expect(slot).toEqual({ row: 'bottom', index: 2 });
    });

    it('skips column 0 if only column 2 tech is owned', () => {
      const slot = getNextSlot(
        createComputer({
          topSlots: ['d1', 'd2', 'd3'],
          bottomSlots: [null, null, null],
        }),
        [ETechId.COMPUTER_VP_CARD],
      );
      expect(slot).toEqual({ row: 'bottom', index: 2 });
    });
  });

  describe('isComputerTopRowFull', () => {
    it('returns false when top has empty slots', () => {
      expect(
        isComputerTopRowFull(createComputer({ topSlots: ['d1', null, null] })),
      ).toBe(false);
    });

    it('returns true when top row is full', () => {
      expect(
        isComputerTopRowFull(createComputer({ topSlots: ['d1', 'd2', 'd3'] })),
      ).toBe(true);
    });
  });

  describe('isComputerFull', () => {
    it('returns false when slots available', () => {
      expect(isComputerFull(createComputer())).toBe(false);
    });

    it('returns true when all slots filled (no techs)', () => {
      expect(
        isComputerFull(
          createComputer({
            topSlots: ['d1', 'd2', 'd3'],
            bottomSlots: ['d4'],
          }),
        ),
      ).toBe(true);
    });

    it('returns false when bottom slots exist but no tech to unlock them', () => {
      expect(
        isComputerFull(
          createComputer({
            topSlots: ['d1', 'd2', 'd3'],
            bottomSlots: [null, null],
          }),
          [ETechId.PROBE_DOUBLE_PROBE],
        ),
      ).toBe(true);
    });

    it('returns false when tech-unlocked bottom slots are empty', () => {
      expect(
        isComputerFull(
          createComputer({
            topSlots: ['d1', 'd2', 'd3'],
            bottomSlots: [null, null],
          }),
          [ETechId.COMPUTER_VP_CREDIT],
        ),
      ).toBe(false);
    });
  });

  describe('getComputerPlacedCount', () => {
    it('returns 0 for empty computer', () => {
      expect(getComputerPlacedCount(createComputer())).toBe(0);
    });

    it('counts top and bottom slots', () => {
      expect(
        getComputerPlacedCount(
          createComputer({
            topSlots: ['d1', 'd2', null],
            bottomSlots: ['d3', null],
          }),
        ),
      ).toBe(3);
    });
  });
});
