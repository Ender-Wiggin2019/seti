import type {
  IComputerColumnConfig,
  IComputerSlotReward,
} from '@seti/common/types/computer';
import { DEFAULT_COLUMN_CONFIGS } from '@seti/common/types/computer';
import type { ETechId } from '@seti/common/types/tech';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import {
  ComputerColumn,
  type IComputerColumnState,
  type ITechPlacement,
} from './ComputerColumn.js';

export { type ITechPlacement, type IComputerColumnState } from './ComputerColumn.js';

export enum EComputerRow {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
}

export interface IComputerPosition {
  row: EComputerRow;
  index: number;
}

export class Computer {
  private readonly columns: ComputerColumn[];

  public constructor(
    configs: readonly IComputerColumnConfig[] = DEFAULT_COLUMN_CONFIGS,
  ) {
    if (configs.length === 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'Computer must have at least one column',
      );
    }
    this.columns = configs.map((c) => new ComputerColumn(c));
  }

  public get columnCount(): number {
    return this.columns.length;
  }

  /**
   * Place data on the specified position.
   * Returns the slot reward if one exists, or null.
   */
  public placeData(position: IComputerPosition): IComputerSlotReward | null {
    this.validatePosition(position);
    const column = this.columns[position.index];

    if (position.row === EComputerRow.TOP) {
      this.enforceLeftToRight(position.index);
      return column.placeTopData();
    }

    if (position.row === EComputerRow.BOTTOM) {
      return column.placeBottomData();
    }

    throw new GameError(EErrorCode.VALIDATION_ERROR, 'Unknown computer row', {
      row: position.row,
    });
  }

  /**
   * Place a blue tech tile on a column, creating a bottom slot.
   * The column's top reward becomes 2 VP; the bottom slot uses the tech's reward.
   */
  public placeTech(columnIndex: number, placement: ITechPlacement): void {
    this.validateColumnIndex(columnIndex);
    this.columns[columnIndex].placeTech(placement);
  }

  public isConnected(): boolean {
    return this.columns.every((c) => c.topFilled);
  }

  public isFull(): boolean {
    return this.getPlacedCount() === this.getCapacity();
  }

  public clear(): void {
    for (const column of this.columns) {
      column.clear();
    }
  }

  public getPlacedCount(): number {
    let count = 0;
    for (const column of this.columns) {
      if (column.topFilled) count++;
      if (column.bottomFilled) count++;
    }
    return count;
  }

  public getCapacity(): number {
    let cap = this.columns.length;
    for (const column of this.columns) {
      if (column.hasBottomSlot) cap++;
    }
    return cap;
  }

  public getTopSlots(): ReadonlyArray<boolean> {
    return this.columns.map((c) => c.topFilled);
  }

  /**
   * Returns per-column bottom slot state:
   *   null  = no bottom slot (no tech placed)
   *   false = empty bottom slot
   *   true  = filled bottom slot
   */
  public getBottomSlotStates(): ReadonlyArray<boolean | null> {
    return this.columns.map((c) =>
      c.hasBottomSlot ? c.bottomFilled : null,
    );
  }

  public getColumnStates(): ReadonlyArray<IComputerColumnState> {
    return this.columns.map((c) => c.getState());
  }

  public getColumnState(index: number): IComputerColumnState {
    this.validateColumnIndex(index);
    return this.columns[index].getState();
  }

  /** Index of the next empty top slot (-1 if all filled). */
  public getNextTopIndex(): number {
    return this.columns.findIndex((c) => !c.topFilled);
  }

  /** Column indices with an unfilled bottom slot whose top is already filled. */
  public getAvailableBottomIndices(): number[] {
    const result: number[] = [];
    for (let i = 0; i < this.columns.length; i++) {
      const c = this.columns[i];
      if (c.hasBottomSlot && c.topFilled && !c.bottomFilled) {
        result.push(i);
      }
    }
    return result;
  }

  /** Map of columnIndex → techId for all placed tech tiles. */
  public getTechPlacementMap(): ReadonlyMap<number, ETechId> {
    const map = new Map<number, ETechId>();
    for (let i = 0; i < this.columns.length; i++) {
      const techId = this.columns[i].techId;
      if (techId) map.set(i, techId);
    }
    return map;
  }

  /** Column indices eligible for tech placement (techSlotAvailable and no tech yet). */
  public getEligibleTechColumns(): number[] {
    return this.columns
      .map((c, i) => (c.canPlaceTech ? i : -1))
      .filter((i) => i >= 0);
  }

  private validatePosition(position: IComputerPosition): void {
    if (!Number.isInteger(position.index) || position.index < 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'position.index must be a non-negative integer',
        { position },
      );
    }
    this.validateColumnIndex(position.index);
  }

  private validateColumnIndex(index: number): void {
    if (index < 0 || index >= this.columns.length) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'Column index out of range',
        { index, columnCount: this.columns.length },
      );
    }
  }

  private enforceLeftToRight(index: number): void {
    const nextEmpty = this.columns.findIndex((c) => !c.topFilled);
    if (nextEmpty !== index) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Top row must be filled from left to right',
        { expectedIndex: nextEmpty, actualIndex: index },
      );
    }
  }
}
