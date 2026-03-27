import type {
  IComputerColumnConfig,
  IComputerSlotReward,
} from '@seti/common/types/computer';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { Computer, type IComputerPosition } from './Computer.js';
import { DATA_POOL_MAX, DataPool } from './DataPool.js';

export interface IDataState {
  pool: number;
  computer: number;
  stash: number;
  total: number;
  poolMax: number;
  computerMax: number;
  totalMax: number;
}

export interface IDataInit {
  poolCount?: number;
  stashCount?: number;
  poolMax?: number;
  columnConfigs?: readonly IComputerColumnConfig[];
}

function assertValidAmount(label: string, amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new GameError(
      EErrorCode.VALIDATION_ERROR,
      `${label} must be a non-negative integer`,
      { label, amount },
    );
  }
}

export class Data {
  private readonly dataPoolInstance: DataPool;

  private readonly computerInstance: Computer;

  private stashCountValue: number;

  public constructor(init: IDataInit = {}) {
    const stashCount = init.stashCount ?? 0;
    assertValidAmount('stashCount', stashCount);

    this.dataPoolInstance = new DataPool(
      init.poolCount,
      init.poolMax ?? DATA_POOL_MAX,
    );
    this.computerInstance = new Computer(init.columnConfigs);
    this.stashCountValue = stashCount;

    const overflow = this.total - this.totalMax;
    if (overflow > 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'Initial data exceeds combined capacity',
        {
          pool: this.poolCount,
          computer: this.computerCount,
          stash: this.stashCount,
          totalMax: this.totalMax,
        },
      );
    }
  }

  public get dataPool(): DataPool {
    return this.dataPoolInstance;
  }

  public get computer(): Computer {
    return this.computerInstance;
  }

  public get stashCount(): number {
    return this.stashCountValue;
  }

  public get poolCount(): number {
    return this.dataPoolInstance.count;
  }

  public get computerCount(): number {
    return this.computerInstance.getPlacedCount();
  }

  public get total(): number {
    return this.poolCount + this.computerCount + this.stashCountValue;
  }

  public get totalMax(): number {
    return this.dataPoolInstance.max + this.computerInstance.getCapacity();
  }

  public has(amount: number): boolean {
    assertValidAmount('amount', amount);
    return this.total >= amount;
  }

  public addToStash(amount: number): number {
    assertValidAmount('amount', amount);
    const actualAdded = Math.min(amount, this.totalMax - this.total);
    this.stashCountValue += actualAdded;
    return actualAdded;
  }

  public spend(amount: number): void {
    assertValidAmount('amount', amount);
    if (amount > this.total) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'Not enough data to spend',
        { requested: amount, total: this.total },
      );
    }

    let remaining = amount;
    const fromStash = Math.min(remaining, this.stashCountValue);
    this.stashCountValue -= fromStash;
    remaining -= fromStash;

    if (remaining > 0) {
      const fromPool = Math.min(remaining, this.dataPoolInstance.count);
      this.dataPoolInstance.remove(fromPool);
      remaining -= fromPool;
    }

    if (remaining > 0) {
      const fromComputer = Math.min(
        remaining,
        this.computerInstance.getPlacedCount(),
      );
      this.discardComputerData(fromComputer);
      remaining -= fromComputer;
    }
  }

  public placeFromPoolToComputer(
    position: IComputerPosition,
  ): IComputerSlotReward | null {
    this.dataPoolInstance.remove(1);
    return this.computerInstance.placeData(position);
  }

  public placeFromStashToComputer(
    position: IComputerPosition,
  ): IComputerSlotReward | null {
    if (this.stashCountValue < 1) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'No data in stash',
        {
          stash: this.stashCountValue,
        },
      );
    }
    const reward = this.computerInstance.placeData(position);
    this.stashCountValue -= 1;
    return reward;
  }

  public flushStashToPool(): { movedToPool: number; discarded: number } {
    const movedToPool = this.dataPoolInstance.add(this.stashCountValue);
    const discarded = this.stashCountValue - movedToPool;
    this.stashCountValue = 0;
    return { movedToPool, discarded };
  }

  public discardComputerData(amount: number = this.computerCount): number {
    assertValidAmount('amount', amount);
    const currentCount = this.computerCount;
    if (amount > currentCount) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'Not enough data in computer to discard',
        { requested: amount, current: currentCount },
      );
    }

    if (amount === 0) {
      return 0;
    }

    if (amount !== currentCount) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'Partial computer discard is not supported',
        { requested: amount, current: currentCount },
      );
    }

    this.computerInstance.clear();
    return amount;
  }

  public getState(): IDataState {
    return {
      pool: this.poolCount,
      computer: this.computerCount,
      stash: this.stashCountValue,
      total: this.total,
      poolMax: this.dataPoolInstance.max,
      computerMax: this.computerInstance.getCapacity(),
      totalMax: this.totalMax,
    };
  }
}
