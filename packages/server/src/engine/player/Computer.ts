import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

export enum EComputerRow {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
}

export interface IComputerPosition {
  row: EComputerRow;
  index: number;
}

function assertValidSlotCount(
  label: string,
  value: number,
  minValue: number,
): void {
  if (!Number.isInteger(value) || value < minValue) {
    throw new GameError(
      EErrorCode.VALIDATION_ERROR,
      `${label} must be an integer >= ${minValue}`,
      { label, value, minValue },
    );
  }
}

export class Computer {
  private topSlots: boolean[];

  private bottomSlots: boolean[];

  public constructor(topSlotCount = 3, bottomSlotCount = 0) {
    assertValidSlotCount('topSlotCount', topSlotCount, 1);
    assertValidSlotCount('bottomSlotCount', bottomSlotCount, 0);
    if (bottomSlotCount > topSlotCount) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'bottomSlotCount cannot be greater than topSlotCount',
        { topSlotCount, bottomSlotCount },
      );
    }
    this.topSlots = new Array<boolean>(topSlotCount).fill(false);
    this.bottomSlots = new Array<boolean>(bottomSlotCount).fill(false);
  }

  public placeData(position: IComputerPosition): void {
    if (!Number.isInteger(position.index) || position.index < 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'position.index must be a non-negative integer',
        { position },
      );
    }

    if (position.row === EComputerRow.TOP) {
      this.placeTopData(position.index);
      return;
    }

    if (position.row === EComputerRow.BOTTOM) {
      this.placeBottomData(position.index);
      return;
    }

    throw new GameError(EErrorCode.VALIDATION_ERROR, 'Unknown computer row', {
      row: position.row,
    });
  }

  public isConnected(): boolean {
    return this.topSlots.every((slotFilled) => slotFilled);
  }

  public isFull(): boolean {
    return this.getPlacedCount() === this.getCapacity();
  }

  public clear(): void {
    this.topSlots = this.topSlots.map(() => false);
    this.bottomSlots = this.bottomSlots.map(() => false);
  }

  public getPlacedCount(): number {
    const topCount = this.topSlots.filter((slotFilled) => slotFilled).length;
    const bottomCount = this.bottomSlots.filter(
      (slotFilled) => slotFilled,
    ).length;
    return topCount + bottomCount;
  }

  public getCapacity(): number {
    return this.topSlots.length + this.bottomSlots.length;
  }

  public getTopSlots(): ReadonlyArray<boolean> {
    return [...this.topSlots];
  }

  public getBottomSlots(): ReadonlyArray<boolean> {
    return [...this.bottomSlots];
  }

  private placeTopData(index: number): void {
    if (index >= this.topSlots.length) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Top slot index out of range',
        {
          index,
          slotCount: this.topSlots.length,
        },
      );
    }
    if (this.topSlots[index]) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Top slot is already occupied',
        {
          index,
        },
      );
    }
    const nextTopIndex = this.topSlots.findIndex((slotFilled) => !slotFilled);
    if (nextTopIndex !== index) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Top row must be filled from left to right',
        { expectedIndex: nextTopIndex, actualIndex: index },
      );
    }
    this.topSlots[index] = true;
  }

  private placeBottomData(index: number): void {
    if (index >= this.bottomSlots.length) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Bottom slot index out of range',
        {
          index,
          slotCount: this.bottomSlots.length,
        },
      );
    }
    if (this.bottomSlots[index]) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Bottom slot is already occupied',
        { index },
      );
    }
    if (!this.topSlots[index]) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Bottom slot requires corresponding top slot to be filled',
        { index },
      );
    }

    const nextBottomIndex = this.bottomSlots.findIndex(
      (slotFilled) => !slotFilled,
    );
    if (nextBottomIndex !== index) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Bottom row must be filled from left to right',
        { expectedIndex: nextBottomIndex, actualIndex: index },
      );
    }

    this.bottomSlots[index] = true;
  }
}
