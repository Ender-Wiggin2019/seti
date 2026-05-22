import type { EPlanet } from '@seti/common/types/protocol/enums';

export enum ESolarSystemElementType {
  NULL = 'NULL',
  EMPTY = 'EMPTY',
  COMET = 'COMET',
  ASTEROID = 'ASTEROID',
  PLANET = 'PLANET',
  EARTH = 'EARTH',
  SUN = 'SUN',
}

export interface ISolarSystemElement {
  type: ESolarSystemElementType;
  amount: number;
  planet?: EPlanet;
}

export interface ISolarProbe {
  id: string;
  playerId: string;
}

/**
 * One disc's contribution at a (ring, sector) cell.
 *
 * Each playable cell is the top-down stack of every disc that physically
 * prints terrain on it: disc 1 sits on top, disc 4 (the base board) on the
 * bottom. The visible element is the topmost non-NULL layer — if disc 1
 * has a NULL cutout at this cell, disc 2's contribution shows through;
 * if disc 2 is also NULL, disc 3's; and so on. Disc 4 has no NULL slots,
 * so the stack always resolves.
 */
export interface ISolarSystemSpaceLayer {
  /** 1..4. Disc 1 = topmost (smallest), disc 4 = base board (always visible). */
  discIndex: number;
  element: ISolarSystemElement;
  hasPublicityIcon: boolean;
  /**
   * Amount of publicity granted by this layer's icon. Optional: defaults
   * to `1` when `hasPublicityIcon === true` and this field is omitted.
   */
  publicityIconAmount?: number;
}

export interface ISolarSystemSpace {
  id: string;
  ringIndex: number;
  indexInRing: number;
  discIndex: number | null;
  /**
   * Top-down stack of every disc that prints terrain at this cell.
   * Sorted with disc 1 (topmost) first, disc 4 (base) last. Inner-ring
   * cells have multi-disc stacks (ring 1 has 4 layers); ring 4 has just
   * the base disc. The fields below (`hasPublicityIcon`, `elements`,
   * `publicityIconAmount`) are **derived** from this stack and refreshed
   * automatically — call sites read them as before.
   *
   * Optional only for legacy test fixtures and deserialization paths
   * that pre-date the layered model — runtime-built spaces always have
   * a non-empty stack. Callers that need the visible element should
   * read `space.elements` (which is kept in sync) rather than walk the
   * stack themselves.
   */
  layers?: ISolarSystemSpaceLayer[];
  /** Derived: visible layer's `hasPublicityIcon`. */
  hasPublicityIcon: boolean;
  /** Derived: visible layer's `publicityIconAmount`. */
  publicityIconAmount?: number;
  /**
   * Derived: `[visibleLayer.element]` for normal cells. Mutated in-place
   * by dynamic-planet placement (e.g. Oumuamua tile) which writes to the
   * underlying layer instead.
   */
  elements: ISolarSystemElement[];
  occupants: ISolarProbe[];
}

export interface IDisc {
  index: number;
  currentRotation: number;
  spaces: string[];
}

export interface IProbeMoveResult {
  probeId: string;
  fromId: string;
  toId: string;
  movementCost: number;
  publicityGained: number;
}
