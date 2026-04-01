import { EErrorCode } from '@seti/common/types/protocol/errors';
import { Resources } from '@/engine/player/Resources.js';
import { GameError } from '@/shared/errors/GameError.js';

function createDataController(initialTotal = 0) {
  let total = initialTotal;
  const totalMax = 12;
  return {
    has(amount: number): boolean {
      return total >= amount;
    },
    gain(amount: number): number {
      const actual = Math.min(amount, totalMax - total);
      total += actual;
      return actual;
    },
    addToStash(amount: number): number {
      const actual = Math.min(amount, totalMax - total);
      total += actual;
      return actual;
    },
    spend(amount: number): void {
      if (amount > total) {
        throw new GameError(
          EErrorCode.INSUFFICIENT_RESOURCES,
          'Not enough data',
        );
      }
      total -= amount;
    },
    getState() {
      return { total, totalMax };
    },
  };
}

describe('Resources', () => {
  it('exposes scalar getters and data from controller', () => {
    const dataController = createDataController(3);
    const resources = new Resources(
      { credits: 2, energy: 5, publicity: 4 },
      { dataController },
    );

    expect(resources.credits).toBe(2);
    expect(resources.energy).toBe(5);
    expect(resources.publicity).toBe(4);
    expect(resources.data).toBe(3);
  });

  it('gains and spends resource bundles', () => {
    const dataController = createDataController(1);
    const resources = new Resources(
      { credits: 4, energy: 3, publicity: 2 },
      { dataController },
    );

    resources.gain({ credits: 2, energy: 1, publicity: 3, data: 2 });
    expect(resources.toObject()).toEqual({
      credits: 6,
      energy: 4,
      publicity: 5,
      data: 3,
    });

    resources.spend({ credits: 5, energy: 2, publicity: 4, data: 1 });
    expect(resources.toObject()).toEqual({
      credits: 1,
      energy: 2,
      publicity: 1,
      data: 2,
    });
  });

  it('checks affordability and supports canAfford alias', () => {
    const dataController = createDataController(2);
    const resources = new Resources(
      { credits: 4, energy: 3, publicity: 6 },
      { dataController },
    );

    expect(resources.has({ credits: 2 })).toBe(true);
    expect(resources.has({ credits: 5 })).toBe(false);
    expect(resources.has({ publicity: 6 })).toBe(true);
    expect(resources.has({ publicity: 7 })).toBe(false);
    expect(resources.has({ data: 2 })).toBe(true);
    expect(resources.has({ data: 3 })).toBe(false);
    expect(resources.canAfford({ credits: 3, energy: 3 })).toBe(true);
    expect(resources.canAfford({ credits: 4, energy: 4 })).toBe(false);
  });

  it('throws insufficient resources error when spending over capacity', () => {
    const resources = new Resources({ credits: 4, energy: 3, publicity: 1 });

    expect(() => resources.spend({ credits: 5 })).toThrow(GameError);
    try {
      resources.spend({ credits: 5 });
    } catch (error) {
      const gameError = error as GameError;
      expect(gameError.code).toBe(EErrorCode.INSUFFICIENT_RESOURCES);
    }
  });

  it('throws validation errors for negative amounts', () => {
    expect(() => new Resources({ credits: -1 })).toThrow(GameError);

    const resources = new Resources({ credits: 1, energy: 1, publicity: 1 });
    expect(() => resources.gain({ energy: -1 })).toThrow(GameError);
    expect(() => resources.spend({ credits: -1 })).toThrow(GameError);
  });

  it('caps publicity gain at 10 and allows explicit set', () => {
    const resources = new Resources({ credits: 1, energy: 1, publicity: 9 });
    resources.gain({ publicity: 5 });
    expect(resources.publicity).toBe(10);
    resources.setPublicity(7);
    expect(resources.publicity).toBe(7);
    expect(() => resources.setPublicity(11)).toThrow(GameError);
  });

  it('requires dataController for data operations', () => {
    const resources = new Resources({ credits: 1, energy: 1, publicity: 1 });
    expect(() => resources.gain({ data: 1 })).toThrow(GameError);
    expect(() => resources.spend({ data: 1 })).toThrow(GameError);
    expect(() => new Resources({ data: 1 })).toThrow(GameError);
  });
});
