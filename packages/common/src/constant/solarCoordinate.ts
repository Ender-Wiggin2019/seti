/**
 * Shared solar-system coordinate model. Both server (`SolarSystem`) and
 * client (views/rules) derive sector / ring / cell positions through the
 * helpers in this file to avoid scattered `Math.floor(indexInRing / ring)`
 * calculations that can drift apart.
 */

export const SECTOR_COUNT = 8;
export const SOLAR_RING_COUNT = 4;
export type TSolarRingIndex = 1 | 2 | 3 | 4;

/**
 * Cells per ring. Ring N contains `SECTOR_COUNT * N` cells, so each sector
 * occupies exactly `N` consecutive cells on that ring.
 */
export const RING_CELL_COUNTS = [8, 16, 24, 32] as const;

/** Cells a single sector owns on each ring (same as ringIndex by construction). */
export const CELLS_PER_SECTOR_BY_RING: Readonly<
  Record<TSolarRingIndex, number>
> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
};

export interface ISolarCoordinate {
  spaceId: string;
  ringIndex: TSolarRingIndex;
  indexInRing: number;
  sectorIndex: number;
  cellInSector: number;
}

const SPACE_ID_PATTERN = /^ring-(\d+)-cell-(\d+)$/;

export function formatSpaceId(ringIndex: number, indexInRing: number): string {
  return `ring-${ringIndex}-cell-${indexInRing}`;
}

function asRingIndex(raw: number): TSolarRingIndex {
  if (raw === 1 || raw === 2 || raw === 3 || raw === 4) {
    return raw;
  }
  throw new Error(`Invalid ringIndex: ${raw}`);
}

/**
 * Compute the sector index (0..7) a cell belongs to.
 *
 * Each ring has `SECTOR_COUNT * ringIndex` cells; sector `s` owns the
 * consecutive cells `[s * ringIndex, (s + 1) * ringIndex)`. Therefore
 * `sectorIndex = floor(indexInRing / ringIndex)`.
 */
export function sectorIndexOf(ringIndex: number, indexInRing: number): number {
  if (ringIndex <= 0) {
    throw new Error(`Invalid ringIndex: ${ringIndex}`);
  }
  return Math.floor(indexInRing / ringIndex);
}

export function cellInSectorOf(ringIndex: number, indexInRing: number): number {
  if (ringIndex <= 0) {
    throw new Error(`Invalid ringIndex: ${ringIndex}`);
  }
  return indexInRing % ringIndex;
}

export function buildCoordinate(
  ringIndex: number,
  indexInRing: number,
): ISolarCoordinate {
  const ring = asRingIndex(ringIndex);
  return {
    spaceId: formatSpaceId(ring, indexInRing),
    ringIndex: ring,
    indexInRing,
    sectorIndex: sectorIndexOf(ring, indexInRing),
    cellInSector: cellInSectorOf(ring, indexInRing),
  };
}

/**
 * Parse a canonical `ring-N-cell-K` id into a structured coordinate. Returns
 * `null` if the id does not match the pattern (e.g., the synthetic
 * `sun-center` node).
 */
export function coordinateFromSpaceId(
  spaceId: string,
): ISolarCoordinate | null {
  const match = SPACE_ID_PATTERN.exec(spaceId);
  if (!match) {
    return null;
  }
  const ringIndex = Number(match[1]);
  const indexInRing = Number(match[2]);
  if (!Number.isFinite(ringIndex) || !Number.isFinite(indexInRing)) {
    return null;
  }
  try {
    return buildCoordinate(ringIndex, indexInRing);
  } catch {
    return null;
  }
}

/** Returns the ordered list of spaceIds inside `sectorIndex`, ring-1 first. */
export function sectorSpaceIds(sectorIndex: number): string[] {
  if (
    !Number.isInteger(sectorIndex) ||
    sectorIndex < 0 ||
    sectorIndex >= SECTOR_COUNT
  ) {
    throw new Error(`Invalid sectorIndex: ${sectorIndex}`);
  }
  const ids: string[] = [];
  for (let ringOffset = 0; ringOffset < SOLAR_RING_COUNT; ringOffset += 1) {
    const ringIndex = (ringOffset + 1) as TSolarRingIndex;
    const cells = CELLS_PER_SECTOR_BY_RING[ringIndex];
    const base = sectorIndex * cells;
    for (let offset = 0; offset < cells; offset += 1) {
      ids.push(formatSpaceId(ringIndex, base + offset));
    }
  }
  return ids;
}
