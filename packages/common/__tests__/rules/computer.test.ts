import { describe, expect, it } from 'vitest';
import {
  getComputerPlacedCount,
  getNextSlot,
  isComputerFull,
  isComputerTopRowFull,
} from '@/rules/computer';
import type {
  IPublicComputerColumnState,
  IPublicComputerState,
} from '@/types/protocol/gameState';

function col(overrides?: Partial<IPublicComputerColumnState>): IPublicComputerColumnState {
  return {
    topFilled: false,
    topReward: null,
    techId: null,
    hasBottomSlot: false,
    bottomFilled: false,
    bottomReward: null,
    techSlotAvailable: true,
    ...overrides,
  };
}

function createComputer(
  columns: IPublicComputerColumnState[],
): IPublicComputerState {
  return { columns };
}

describe('computer rules', () => {
  describe('getNextSlot', () => {
    it('returns top row index 0 when all empty', () => {
      const slot = getNextSlot(createComputer([col(), col(), col()]));
      expect(slot).toEqual({ row: 'top', index: 0 });
    });

    it('returns next unfilled top slot', () => {
      const slot = getNextSlot(
        createComputer([
          col({ topFilled: true }),
          col(),
          col(),
        ]),
      );
      expect(slot).toEqual({ row: 'top', index: 1 });
    });

    it('returns bottom row when top is full and bottom has space', () => {
      const slot = getNextSlot(
        createComputer([
          col({ topFilled: true, hasBottomSlot: true }),
          col({ topFilled: true }),
          col({ topFilled: true }),
        ]),
      );
      expect(slot).toEqual({ row: 'bottom', index: 0 });
    });

    it('returns null when fully occupied', () => {
      const slot = getNextSlot(
        createComputer([
          col({ topFilled: true, hasBottomSlot: true, bottomFilled: true }),
          col({ topFilled: true }),
          col({ topFilled: true }),
        ]),
      );
      expect(slot).toBeNull();
    });

    it('returns null when top is full and no bottom slots', () => {
      const slot = getNextSlot(
        createComputer([
          col({ topFilled: true }),
          col({ topFilled: true }),
          col({ topFilled: true }),
        ]),
      );
      expect(slot).toBeNull();
    });

    it('skips bottom slot if corresponding top slot is empty', () => {
      const slot = getNextSlot(
        createComputer([
          col({ topFilled: true }),
          col({ hasBottomSlot: true }),
          col(),
        ]),
      );
      expect(slot).toEqual({ row: 'top', index: 1 });
    });

    it('returns first available bottom slot skipping filled ones', () => {
      const slot = getNextSlot(
        createComputer([
          col({ topFilled: true, hasBottomSlot: true, bottomFilled: true }),
          col({ topFilled: true, hasBottomSlot: true }),
          col({ topFilled: true }),
        ]),
      );
      expect(slot).toEqual({ row: 'bottom', index: 1 });
    });
  });

  describe('isComputerTopRowFull', () => {
    it('returns false when top has empty slots', () => {
      expect(
        isComputerTopRowFull(
          createComputer([col({ topFilled: true }), col(), col()]),
        ),
      ).toBe(false);
    });

    it('returns true when top row is full', () => {
      expect(
        isComputerTopRowFull(
          createComputer([
            col({ topFilled: true }),
            col({ topFilled: true }),
            col({ topFilled: true }),
          ]),
        ),
      ).toBe(true);
    });
  });

  describe('isComputerFull', () => {
    it('returns false when slots available', () => {
      expect(isComputerFull(createComputer([col(), col(), col()]))).toBe(false);
    });

    it('returns true when all slots filled (no bottom)', () => {
      expect(
        isComputerFull(
          createComputer([
            col({ topFilled: true }),
            col({ topFilled: true }),
            col({ topFilled: true }),
          ]),
        ),
      ).toBe(true);
    });

    it('returns false when bottom slot exists but not filled', () => {
      expect(
        isComputerFull(
          createComputer([
            col({ topFilled: true, hasBottomSlot: true }),
            col({ topFilled: true }),
            col({ topFilled: true }),
          ]),
        ),
      ).toBe(false);
    });

    it('returns true when bottom slots exist and all filled', () => {
      expect(
        isComputerFull(
          createComputer([
            col({ topFilled: true, hasBottomSlot: true, bottomFilled: true }),
            col({ topFilled: true }),
            col({ topFilled: true }),
          ]),
        ),
      ).toBe(true);
    });
  });

  describe('getComputerPlacedCount', () => {
    it('returns 0 for empty computer', () => {
      expect(
        getComputerPlacedCount(createComputer([col(), col(), col()])),
      ).toBe(0);
    });

    it('counts top and bottom slots', () => {
      expect(
        getComputerPlacedCount(
          createComputer([
            col({ topFilled: true }),
            col({ topFilled: true, hasBottomSlot: true, bottomFilled: true }),
            col(),
          ]),
        ),
      ).toBe(3);
    });
  });
});
