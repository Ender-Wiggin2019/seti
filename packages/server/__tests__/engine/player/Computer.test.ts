import { EErrorCode } from '@seti/common/types/protocol/errors';
import { Computer, EComputerRow } from '@/engine/player/Computer.js';
import { GameError } from '@/shared/errors/GameError.js';

describe('Computer', () => {
  it('validates constructor slot counts', () => {
    expect(() => new Computer(0, 0)).toThrow(GameError);
    expect(() => new Computer(3, -1)).toThrow(GameError);
    expect(() => new Computer(2, 3)).toThrow(GameError);
  });

  it('fills top row from left to right and reports connected/full status', () => {
    const computer = new Computer(3, 0);

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

  it('is connected when top row is full but not full capacity when bottom exists', () => {
    const computer = new Computer(3, 2);
    computer.placeData({ row: EComputerRow.TOP, index: 0 });
    computer.placeData({ row: EComputerRow.TOP, index: 1 });
    computer.placeData({ row: EComputerRow.TOP, index: 2 });

    expect(computer.isConnected()).toBe(true);
    expect(computer.isFull()).toBe(false);
  });

  it('throws when top row is not filled sequentially', () => {
    const computer = new Computer(3, 0);

    expect(() =>
      computer.placeData({ row: EComputerRow.TOP, index: 1 }),
    ).toThrow(GameError);
  });

  it('throws when top position is invalid or already occupied', () => {
    const computer = new Computer(3, 0);

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

  it('requires corresponding top slot before filling bottom slot', () => {
    const computer = new Computer(3, 2);

    expect(() =>
      computer.placeData({ row: EComputerRow.BOTTOM, index: 0 }),
    ).toThrow(GameError);

    computer.placeData({ row: EComputerRow.TOP, index: 0 });
    computer.placeData({ row: EComputerRow.BOTTOM, index: 0 });
    computer.placeData({ row: EComputerRow.TOP, index: 1 });
    computer.placeData({ row: EComputerRow.BOTTOM, index: 1 });

    expect(computer.getPlacedCount()).toBe(4);
    expect(computer.getBottomSlots()).toEqual([true, true]);
  });

  it('throws when bottom row placement is out of order or duplicated', () => {
    const computer = new Computer(3, 2);
    computer.placeData({ row: EComputerRow.TOP, index: 0 });
    computer.placeData({ row: EComputerRow.TOP, index: 1 });

    expect(() =>
      computer.placeData({ row: EComputerRow.BOTTOM, index: 1 }),
    ).toThrow(GameError);

    computer.placeData({ row: EComputerRow.BOTTOM, index: 0 });
    expect(() =>
      computer.placeData({ row: EComputerRow.BOTTOM, index: 0 }),
    ).toThrow(GameError);
    expect(() =>
      computer.placeData({ row: EComputerRow.BOTTOM, index: 2 }),
    ).toThrow(GameError);
  });

  it('clears all placed data tokens', () => {
    const computer = new Computer(3, 2);
    computer.placeData({ row: EComputerRow.TOP, index: 0 });
    computer.placeData({ row: EComputerRow.TOP, index: 1 });
    computer.placeData({ row: EComputerRow.TOP, index: 2 });
    computer.placeData({ row: EComputerRow.BOTTOM, index: 0 });

    computer.clear();

    expect(computer.getPlacedCount()).toBe(0);
    expect(computer.isConnected()).toBe(false);
    expect(computer.isFull()).toBe(false);
    expect(computer.getTopSlots()).toEqual([false, false, false]);
    expect(computer.getBottomSlots()).toEqual([false, false]);
  });

  it('throws validation error for invalid row payload', () => {
    const computer = new Computer(3, 1);

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
});
