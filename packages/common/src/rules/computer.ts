import { ETech } from '../types/element';
import type { IPublicComputerState } from '../types/protocol/gameState';
import { type ETechId, getTechDescriptor } from '../types/tech';

export interface IComputerSlotPosition {
  row: 'top' | 'bottom';
  index: number;
}

/**
 * Returns which bottom-slot column indices are unlocked by the player's
 * computer techs. Each computer tech (comp-0…comp-3) unlocks the bottom
 * slot at the column matching its level.
 */
export function getUnlockedBottomIndices(techs: ETechId[]): Set<number> {
  const levels = new Set<number>();
  for (const id of techs) {
    const desc = getTechDescriptor(id);
    if (desc.type === ETech.COMPUTER) {
      levels.add(desc.level);
    }
  }
  return levels;
}

/**
 * Find the next slot to fill, prioritizing top row (L→R), then any
 * tech-unlocked bottom slot whose corresponding top is filled.
 */
export function getNextSlot(
  computer: IPublicComputerState,
  techs?: ETechId[],
): IComputerSlotPosition | null {
  const nextTopIndex = computer.topSlots.findIndex((slot) => slot === null);
  if (nextTopIndex >= 0) {
    return { row: 'top', index: nextTopIndex };
  }

  const unlockedLevels = techs ? getUnlockedBottomIndices(techs) : null;

  for (let i = 0; i < computer.bottomSlots.length; i++) {
    if (computer.bottomSlots[i] !== null) continue;
    if (computer.topSlots[i] === null) continue;
    if (unlockedLevels !== null && !unlockedLevels.has(i)) continue;
    return { row: 'bottom', index: i };
  }

  return null;
}

export function isComputerTopRowFull(computer: IPublicComputerState): boolean {
  return computer.topSlots.every((slot) => slot !== null);
}

export function isComputerFull(
  computer: IPublicComputerState,
  techs?: ETechId[],
): boolean {
  return getNextSlot(computer, techs) === null;
}

export function getComputerPlacedCount(computer: IPublicComputerState): number {
  const topCount = computer.topSlots.filter((s) => s !== null).length;
  const bottomCount = computer.bottomSlots.filter((s) => s !== null).length;
  return topCount + bottomCount;
}
