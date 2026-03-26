import { GameError } from '@/shared/errors/GameError.js';
import { EComputerRow } from './Computer.js';
import { Data } from './Data.js';

describe('Data', () => {
  it('tracks pool, computer, stash and total capacities', () => {
    const data = new Data({
      poolCount: 2,
      stashCount: 1,
      computerTopSlots: 3,
      computerBottomSlots: 1,
    });

    expect(data.getState()).toEqual({
      pool: 2,
      computer: 0,
      stash: 1,
      total: 3,
      poolMax: 6,
      computerMax: 4,
      totalMax: 10,
    });
  });

  it('adds incoming data into stash with overflow discard', () => {
    const data = new Data({
      poolCount: 6,
      stashCount: 0,
      computerTopSlots: 3,
      computerBottomSlots: 0,
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
      computerTopSlots: 3,
      computerBottomSlots: 0,
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
      computerTopSlots: 3,
      computerBottomSlots: 1,
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
      computerTopSlots: 3,
      computerBottomSlots: 0,
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
});
