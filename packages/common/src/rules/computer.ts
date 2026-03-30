import type { IPublicComputerState } from '../types/protocol/gameState';

export interface IComputerSlotPosition {
  row: 'top' | 'bottom';
  index: number;
}

/**
 * Find the next slot to fill: top row L→R first, then any available
 * bottom slot (requires tech placed + corresponding top filled).
 */
export function getNextSlot(
  computer: IPublicComputerState,
): IComputerSlotPosition | null {
  const nextTopIndex = computer.columns.findIndex((col) => !col.topFilled);
  if (nextTopIndex >= 0) {
    return { row: 'top', index: nextTopIndex };
  }

  for (let i = 0; i < computer.columns.length; i++) {
    const col = computer.columns[i];
    if (col.hasBottomSlot && col.topFilled && !col.bottomFilled) {
      return { row: 'bottom', index: i };
    }
  }

  return null;
}

export function isComputerTopRowFull(computer: IPublicComputerState): boolean {
  return computer.columns.every((col) => col.topFilled);
}

export function isComputerFull(computer: IPublicComputerState): boolean {
  return getNextSlot(computer) === null;
}

export function getComputerPlacedCount(computer: IPublicComputerState): number {
  let count = 0;
  for (const col of computer.columns) {
    if (col.topFilled) count++;
    if (col.bottomFilled) count++;
  }
  return count;
}
