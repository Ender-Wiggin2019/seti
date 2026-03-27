import type { IComputerColumnConfig } from '@seti/common/types/computer';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { ETechId } from '@seti/common/types/tech';
import { Computer, EComputerRow } from '@/engine/player/Computer.js';
import { TECH_TOP_REWARD } from '@/engine/player/ComputerColumn.js';
import { GameError } from '@/shared/errors/GameError.js';

const SIMPLE_3_COL: IComputerColumnConfig[] = [
  { topReward: null, techSlotAvailable: true },
  { topReward: null, techSlotAvailable: true },
  { topReward: null, techSlotAvailable: true },
];

describe('Computer', () => {
  it('creates default 6-column computer', () => {
    const computer = new Computer();
    expect(computer.columnCount).toBe(6);
    expect(computer.getTopSlots()).toHaveLength(6);
  });

  it('validates empty column configs', () => {
    expect(() => new Computer([])).toThrow(GameError);
  });

  it('fills top row from left to right and reports connected/full status', () => {
    const computer = new Computer(SIMPLE_3_COL);

    expect(computer.isConnected()).toBe(false);
    expect(computer.isFull()).toBe(false);
    computer.placeData({ row: EComputerRow.TOP, index: 0 });
    computer.placeData({ row: EComputerRow.TOP, index: 1 });
    computer.placeData({ row: EComputerRow.TOP, index: 2 });

    expect(computer.isConnected()).toBe(true);
    expect(computer.isFull()).toBe(true);
    expect(computer.getPlacedCount()).toBe(3);
    expect(computer.getTopSlots()).toEqual([true, true, true]);
  });

  it('is connected when top full but not full when bottom slot exists', () => {
    const computer = new Computer(SIMPLE_3_COL);
    computer.placeTech(0, {
      techId: ETechId.COMPUTER_VP_CREDIT,
      bottomReward: { credits: 1 },
    });
    computer.placeData({ row: EComputerRow.TOP, index: 0 });
    computer.placeData({ row: EComputerRow.TOP, index: 1 });
    computer.placeData({ row: EComputerRow.TOP, index: 2 });

    expect(computer.isConnected()).toBe(true);
    expect(computer.isFull()).toBe(false);
  });

  it('throws when top row is not filled sequentially', () => {
    const computer = new Computer(SIMPLE_3_COL);

    expect(() =>
      computer.placeData({ row: EComputerRow.TOP, index: 1 }),
    ).toThrow(GameError);
  });

  it('throws when top position is invalid or already occupied', () => {
    const computer = new Computer(SIMPLE_3_COL);

    expect(() =>
      computer.placeData({ row: EComputerRow.TOP, index: -1 }),
    ).toThrow(GameError);
    expect(() =>
      computer.placeData({ row: EComputerRow.TOP, index: 3 }),
    ).toThrow(GameError);

    computer.placeData({ row: EComputerRow.TOP, index: 0 });
    expect(() =>
      computer.placeData({ row: EComputerRow.TOP, index: 0 }),
    ).toThrow(GameError);
  });

  it('requires tech placement to have bottom slot', () => {
    const computer = new Computer(SIMPLE_3_COL);
    computer.placeData({ row: EComputerRow.TOP, index: 0 });

    expect(() =>
      computer.placeData({ row: EComputerRow.BOTTOM, index: 0 }),
    ).toThrow(GameError);
  });

  it('fills bottom slot after placing tech and top data', () => {
    const computer = new Computer(SIMPLE_3_COL);
    computer.placeTech(0, {
      techId: ETechId.COMPUTER_VP_CREDIT,
      bottomReward: { credits: 1 },
    });
    computer.placeTech(1, {
      techId: ETechId.COMPUTER_VP_ENERGY,
      bottomReward: { energy: 1 },
    });

    computer.placeData({ row: EComputerRow.TOP, index: 0 });
    computer.placeData({ row: EComputerRow.BOTTOM, index: 0 });
    computer.placeData({ row: EComputerRow.TOP, index: 1 });
    computer.placeData({ row: EComputerRow.BOTTOM, index: 1 });

    expect(computer.getPlacedCount()).toBe(4);
    expect(computer.getBottomSlotStates()).toEqual([true, true, null]);
  });

  it('allows bottom row placement in any order when top is filled', () => {
    const computer = new Computer(SIMPLE_3_COL);
    computer.placeTech(0, {
      techId: ETechId.COMPUTER_VP_CREDIT,
      bottomReward: { credits: 1 },
    });
    computer.placeTech(1, {
      techId: ETechId.COMPUTER_VP_ENERGY,
      bottomReward: { energy: 1 },
    });
    computer.placeData({ row: EComputerRow.TOP, index: 0 });
    computer.placeData({ row: EComputerRow.TOP, index: 1 });

    computer.placeData({ row: EComputerRow.BOTTOM, index: 1 });
    expect(computer.getBottomSlotStates()).toEqual([false, true, null]);

    computer.placeData({ row: EComputerRow.BOTTOM, index: 0 });
    expect(computer.getBottomSlotStates()).toEqual([true, true, null]);
  });

  it('throws when bottom slot is duplicated or out of range', () => {
    const computer = new Computer(SIMPLE_3_COL);
    computer.placeTech(0, {
      techId: ETechId.COMPUTER_VP_CREDIT,
      bottomReward: { credits: 1 },
    });
    computer.placeData({ row: EComputerRow.TOP, index: 0 });
    computer.placeData({ row: EComputerRow.BOTTOM, index: 0 });

    expect(() =>
      computer.placeData({ row: EComputerRow.BOTTOM, index: 0 }),
    ).toThrow(GameError);
    expect(() =>
      computer.placeData({ row: EComputerRow.BOTTOM, index: 2 }),
    ).toThrow(GameError);
  });

  it('clears all placed data tokens but retains tech placements', () => {
    const computer = new Computer(SIMPLE_3_COL);
    computer.placeTech(0, {
      techId: ETechId.COMPUTER_VP_CREDIT,
      bottomReward: { credits: 1 },
    });
    computer.placeData({ row: EComputerRow.TOP, index: 0 });
    computer.placeData({ row: EComputerRow.TOP, index: 1 });
    computer.placeData({ row: EComputerRow.TOP, index: 2 });
    computer.placeData({ row: EComputerRow.BOTTOM, index: 0 });

    computer.clear();

    expect(computer.getPlacedCount()).toBe(0);
    expect(computer.isConnected()).toBe(false);
    expect(computer.isFull()).toBe(false);
    expect(computer.getTopSlots()).toEqual([false, false, false]);
    expect(computer.getColumnStates()[0].hasBottomSlot).toBe(true);
  });

  it('throws validation error for invalid row payload', () => {
    const computer = new Computer(SIMPLE_3_COL);

    expect(() =>
      computer.placeData({ row: 'MIDDLE' as never, index: 0 }),
    ).toThrow(GameError);

    try {
      computer.placeData({ row: 'MIDDLE' as never, index: 0 });
    } catch (error) {
      const gameError = error as GameError;
      expect(gameError.code).toBe(EErrorCode.VALIDATION_ERROR);
    }
  });

  describe('tech placement', () => {
    it('placing tech creates bottom slot', () => {
      const computer = new Computer(SIMPLE_3_COL);
      computer.placeTech(1, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });

      const col = computer.getColumnState(1);
      expect(col.hasBottomSlot).toBe(true);
      expect(col.techId).toBe(ETechId.COMPUTER_VP_CREDIT);
      expect(col.topReward).toEqual(TECH_TOP_REWARD);
      expect(col.bottomReward).toEqual({ credits: 1 });
    });

    it('rejects tech on a column that disallows tech placement', () => {
      const configs: IComputerColumnConfig[] = [
        { topReward: { publicity: 1 }, techSlotAvailable: false },
        { topReward: null, techSlotAvailable: true },
      ];
      const computer = new Computer(configs);

      expect(() =>
        computer.placeTech(0, {
          techId: ETechId.COMPUTER_VP_CREDIT,
          bottomReward: { credits: 1 },
        }),
      ).toThrow(GameError);
    });

    it('rejects duplicate tech on same column', () => {
      const computer = new Computer(SIMPLE_3_COL);
      computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });

      expect(() =>
        computer.placeTech(0, {
          techId: ETechId.COMPUTER_VP_ENERGY,
          bottomReward: { energy: 1 },
        }),
      ).toThrow(GameError);
    });

    it('getEligibleTechColumns returns columns without tech that allow placement', () => {
      const computer = new Computer(SIMPLE_3_COL);
      expect(computer.getEligibleTechColumns()).toEqual([0, 1, 2]);

      computer.placeTech(1, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });
      expect(computer.getEligibleTechColumns()).toEqual([0, 2]);
    });
  });

  describe('rewards from placeData', () => {
    it('returns configured top reward when placing data', () => {
      const configs: IComputerColumnConfig[] = [
        { topReward: { publicity: 1 }, techSlotAvailable: false },
        { topReward: null, techSlotAvailable: true },
      ];
      const computer = new Computer(configs);

      const reward = computer.placeData({ row: EComputerRow.TOP, index: 0 });
      expect(reward).toEqual({ publicity: 1 });
    });

    it('returns 2VP top reward when tech is placed', () => {
      const computer = new Computer(SIMPLE_3_COL);
      computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });

      const reward = computer.placeData({ row: EComputerRow.TOP, index: 0 });
      expect(reward).toEqual({ vp: 2 });
    });

    it('returns tech bottom reward when placing bottom data', () => {
      const computer = new Computer(SIMPLE_3_COL);
      computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });
      computer.placeData({ row: EComputerRow.TOP, index: 0 });

      const reward = computer.placeData({ row: EComputerRow.BOTTOM, index: 0 });
      expect(reward).toEqual({ credits: 1 });
    });

    it('returns null for top slot without reward or tech', () => {
      const computer = new Computer(SIMPLE_3_COL);
      const reward = computer.placeData({ row: EComputerRow.TOP, index: 0 });
      expect(reward).toBeNull();
    });
  });

  describe('default 6-column layout', () => {
    it('has correct built-in rewards and tech eligibility', () => {
      const computer = new Computer();
      const states = computer.getColumnStates();

      expect(states[0].techSlotAvailable).toBe(true);
      expect(states[0].topReward).toBeNull();

      expect(states[1].techSlotAvailable).toBe(false);
      expect(states[1].topReward).toEqual({ publicity: 1 });

      expect(states[2].techSlotAvailable).toBe(true);
      expect(states[2].topReward).toBeNull();

      expect(states[3].techSlotAvailable).toBe(false);
      expect(states[3].topReward).toEqual({ tuckIncome: 1 });

      expect(states[4].techSlotAvailable).toBe(true);
      expect(states[4].topReward).toBeNull();

      expect(states[5].techSlotAvailable).toBe(true);
      expect(states[5].topReward).toBeNull();
    });

    it('eligible tech columns are [0, 2, 4, 5]', () => {
      const computer = new Computer();
      expect(computer.getEligibleTechColumns()).toEqual([0, 2, 4, 5]);
    });
  });
});
