import { EErrorCode } from '@seti/common/types/protocol/errors';
import { DATA_POOL_MAX, DataPool } from '@/engine/player/DataPool.js';
import { GameError } from '@/shared/errors/GameError.js';

describe('DataPool', () => {
  it('validates constructor constraints', () => {
    expect(() => new DataPool(1, 0)).toThrow(GameError);
    expect(() => new DataPool(-1, 6)).toThrow(GameError);
    expect(() => new DataPool(7, 6)).toThrow(GameError);
  });

  it('adds and removes data within bounds', () => {
    const dataPool = new DataPool(1);

    const added = dataPool.add(3);
    expect(added).toBe(3);
    expect(dataPool.count).toBe(4);

    dataPool.remove(2);
    expect(dataPool.count).toBe(2);
  });

  it('caps additions at max and returns actual added amount', () => {
    const dataPool = new DataPool(DATA_POOL_MAX - 1);

    const added = dataPool.add(5);
    expect(added).toBe(1);
    expect(dataPool.count).toBe(DATA_POOL_MAX);
    expect(dataPool.isFull()).toBe(true);
  });

  it('supports zero changes', () => {
    const dataPool = new DataPool(2);

    expect(dataPool.add(0)).toBe(0);
    expect(dataPool.count).toBe(2);
    dataPool.remove(0);
    expect(dataPool.count).toBe(2);
  });

  it('throws when removing more than available', () => {
    const dataPool = new DataPool(2);

    expect(() => dataPool.remove(3)).toThrow(GameError);
    try {
      dataPool.remove(3);
    } catch (error) {
      const gameError = error as GameError;
      expect(gameError.code).toBe(EErrorCode.INSUFFICIENT_RESOURCES);
    }
  });

  it('throws validation error for negative operation amounts', () => {
    const dataPool = new DataPool(2);

    expect(() => dataPool.add(-1)).toThrow(GameError);
    expect(() => dataPool.remove(-1)).toThrow(GameError);
  });
});
