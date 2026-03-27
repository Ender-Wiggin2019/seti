import type { IComputerColumnConfig } from '@seti/common/types/computer';
import { EComputerRow } from '@/engine/player/Computer.js';
import { Data } from '@/engine/player/Data.js';
import { GameError } from '@/shared/errors/GameError.js';

const SIMPLE_3_COL: IComputerColumnConfig[] = [
  { topReward: null, techSlotAvailable: true },
  { topReward: null, techSlotAvailable: true },
  { topReward: null, techSlotAvailable: true },
];

describe('Data', () => {
  it('tracks pool, computer, stash and total capacities', () => {
    const data = new Data({
      poolCount: 2,
      stashCount: 1,
      columnConfigs: SIMPLE_3_COL,
    });

    expect(data.getState()).toEqual({
      pool: 2,
      computer: 0,
      stash: 1,
      total: 3,
      poolMax: 6,
      computerMax: 3,
      totalMax: 9,
    });
  });

  it('adds incoming data into stash with overflow discard', () => {
    const data = new Data({
      poolCount: 6,
      stashCount: 0,
      columnConfigs: SIMPLE_3_COL,
    });
    const actualAdded = data.addToStash(5);
    expect(actualAdded).toBe(3);
    expect(data.getState().stash).toBe(3);
    expect(data.getState().total).toBe(9);
  });

  it('flushes stash into pool at turn end with discard overflow', () => {
    const data = new Data({
      poolCount: 5,
      stashCount: 3,
      columnConfigs: SIMPLE_3_COL,
    });

    const result = data.flushStashToPool();
    expect(result).toEqual({ movedToPool: 1, discarded: 2 });
    expect(data.getState().pool).toBe(6);
    expect(data.getState().stash).toBe(0);
  });

  it('moves data from pool or stash into computer slots', () => {
    const data = new Data({
      poolCount: 2,
      stashCount: 1,
      columnConfigs: SIMPLE_3_COL,
    });

    data.placeFromPoolToComputer({ row: EComputerRow.TOP, index: 0 });
    data.placeFromStashToComputer({ row: EComputerRow.TOP, index: 1 });

    expect(data.getState().pool).toBe(1);
    expect(data.getState().stash).toBe(0);
    expect(data.getState().computer).toBe(2);
  });

  it('spends data from stash then pool then computer', () => {
    const data = new Data({
      poolCount: 2,
      stashCount: 2,
      columnConfigs: SIMPLE_3_COL,
    });
    data.placeFromPoolToComputer({ row: EComputerRow.TOP, index: 0 });

    data.spend(4);
    expect(data.getState()).toMatchObject({
      pool: 0,
      stash: 0,
      computer: 0,
      total: 0,
    });
  });

  it('throws on invalid data usage', () => {
    const data = new Data();
    expect(() =>
      data.placeFromStashToComputer({ row: EComputerRow.TOP, index: 0 }),
    ).toThrow(GameError);
    expect(() => data.spend(1)).toThrow(GameError);
    expect(() => data.discardComputerData(1)).toThrow(GameError);
  });

  it('placeFromPoolToComputer returns slot reward', () => {
    const configs: IComputerColumnConfig[] = [
      { topReward: { publicity: 1 }, techSlotAvailable: false },
      { topReward: null, techSlotAvailable: true },
    ];
    const data = new Data({ poolCount: 2, columnConfigs: configs });

    const reward = data.placeFromPoolToComputer({
      row: EComputerRow.TOP,
      index: 0,
    });
    expect(reward).toEqual({ publicity: 1 });

    const noReward = data.placeFromPoolToComputer({
      row: EComputerRow.TOP,
      index: 1,
    });
    expect(noReward).toBeNull();
  });

  it('uses default 6-column config when no configs specified', () => {
    const data = new Data();
    expect(data.computer.columnCount).toBe(6);
  });
});
