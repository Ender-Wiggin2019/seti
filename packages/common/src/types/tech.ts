import { ETech } from '@seti/common/types/element';

/**
 * Concrete tech categories (excludes ETech.ANY wildcard).
 * Maps to the three orbital colors: Orange (Probe/fly), Red (Scan/look), Blue (Computer/comp).
 */
export const TECH_CATEGORIES = [
  ETech.PROBE,
  ETech.SCAN,
  ETech.COMPUTER,
] as const;
export type TTechCategory = (typeof TECH_CATEGORIES)[number];

export const TECH_LEVELS = [0, 1, 2, 3] as const;
export type TTechLevel = (typeof TECH_LEVELS)[number];

export const TILES_PER_STACK = 4;
export const FIRST_TAKE_VP_BONUS = 2;
export const RESEARCH_PUBLICITY_COST = 6;
export const TECH_STACKS_COUNT = 12;

export interface ITechTileDescriptor {
  type: TTechCategory;
  level: TTechLevel;
}

/**
 * Flat enum for all 12 individual tech identifiers.
 * Format: `{category}-{level}` for serialization.
 *
 * Probe (Orange / fly):
 *   0 = Double Probe Limit, 1 = Asteroid, 2 = Rover Discount, 3 = Moon Landing
 * Scan (Red / look):
 *   0 = Earth Look, 1 = Pop Signal, 2 = Hand Signal, 3 = Energy Launch
 * Computer (Blue / comp):
 *   0 = VP + Credit, 1 = VP + Energy, 2 = VP + Card, 3 = VP + Publicity
 */
export enum ETechId {
  PROBE_DOUBLE_PROBE = 'probe-0',
  PROBE_ASTEROID = 'probe-1',
  PROBE_ROVER_DISCOUNT = 'probe-2',
  PROBE_MOON = 'probe-3',
  SCAN_EARTH_LOOK = 'scan-0',
  SCAN_POP_SIGNAL = 'scan-1',
  SCAN_HAND_SIGNAL = 'scan-2',
  SCAN_ENERGY_LAUNCH = 'scan-3',
  COMPUTER_VP_CREDIT = 'comp-0',
  COMPUTER_VP_ENERGY = 'comp-1',
  COMPUTER_VP_CARD = 'comp-2',
  COMPUTER_VP_PUBLICITY = 'comp-3',
}

export const ALL_TECH_IDS: readonly ETechId[] = Object.values(ETechId);

const TECH_ID_TO_DESCRIPTOR: Record<ETechId, ITechTileDescriptor> = {
  [ETechId.PROBE_DOUBLE_PROBE]: { type: ETech.PROBE, level: 0 },
  [ETechId.PROBE_ASTEROID]: { type: ETech.PROBE, level: 1 },
  [ETechId.PROBE_ROVER_DISCOUNT]: { type: ETech.PROBE, level: 2 },
  [ETechId.PROBE_MOON]: { type: ETech.PROBE, level: 3 },
  [ETechId.SCAN_EARTH_LOOK]: { type: ETech.SCAN, level: 0 },
  [ETechId.SCAN_POP_SIGNAL]: { type: ETech.SCAN, level: 1 },
  [ETechId.SCAN_HAND_SIGNAL]: { type: ETech.SCAN, level: 2 },
  [ETechId.SCAN_ENERGY_LAUNCH]: { type: ETech.SCAN, level: 3 },
  [ETechId.COMPUTER_VP_CREDIT]: { type: ETech.COMPUTER, level: 0 },
  [ETechId.COMPUTER_VP_ENERGY]: { type: ETech.COMPUTER, level: 1 },
  [ETechId.COMPUTER_VP_CARD]: { type: ETech.COMPUTER, level: 2 },
  [ETechId.COMPUTER_VP_PUBLICITY]: { type: ETech.COMPUTER, level: 3 },
};

export function getTechDescriptor(techId: ETechId): ITechTileDescriptor {
  return TECH_ID_TO_DESCRIPTOR[techId];
}

export function getTechId(type: TTechCategory, level: TTechLevel): ETechId {
  const categoryPrefix: Record<TTechCategory, string> = {
    [ETech.PROBE]: 'probe',
    [ETech.SCAN]: 'scan',
    [ETech.COMPUTER]: 'comp',
  };
  return `${categoryPrefix[type]}-${level}` as ETechId;
}

export function getTechIdsForCategory(category: TTechCategory): ETechId[] {
  return TECH_LEVELS.map((level) => getTechId(category, level));
}
