import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

export const DATA_POOL_MAX = 6;

function assertValidAmount(label: string, amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new GameError(
      EErrorCode.VALIDATION_ERROR,
      `${label} must be a non-negative integer`,
      { label, amount },
    );
  }
}

export class DataPool {
  private currentCount: number;

  public readonly max: number;

  public constructor(initialCount = 0, max: number = DATA_POOL_MAX) {
    assertValidAmount('initialCount', initialCount);
    assertValidAmount('max', max);
    if (max === 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'max must be greater than 0',
        {
          max,
        },
      );
    }
    if (initialCount > max) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'initialCount cannot exceed max',
        { initialCount, max },
      );
    }
    this.currentCount = initialCount;
    this.max = max;
  }

  public get count(): number {
    return this.currentCount;
  }

  public add(amount: number): number {
    assertValidAmount('amount', amount);
    const actualAdded = Math.min(amount, this.max - this.currentCount);
    this.currentCount += actualAdded;
    return actualAdded;
  }

  public remove(amount: number): void {
    assertValidAmount('amount', amount);
    if (amount > this.currentCount) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'Not enough data in pool',
        { requested: amount, current: this.currentCount },
      );
    }
    this.currentCount -= amount;
  }

  public isFull(): boolean {
    return this.currentCount >= this.max;
  }
}
