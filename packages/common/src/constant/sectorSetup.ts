import { ESector } from '@seti/common/types/element';

/** Physical sector tile IDs — each tile covers 2 game sectors */
export enum ESectorTileId {
  TILE_1 = 1,
  TILE_2 = 2,
  TILE_3 = 3,
  TILE_4 = 4,
}

/** Star system names printed on sector tiles */
export enum EStarName {
  PROCYON = 'procyon',
  VEGA = 'vega',
  SIRIUS_A = 'sirius-a',
  BARNARDS_STAR = 'barnards-star',
  KEPLER_22 = 'kepler-22',
  PROXIMA_CENTAURI = 'proxima-centauri',
  SIXTY_ONE_VIRGINIS = '61-virginis',
  BETA_PICTORIS = 'beta-pictoris',
}

/** Cardinal position on the solar system board */
export enum ESectorPosition {
  NORTH = 'north',
  WEST = 'west',
  EAST = 'east',
  SOUTH = 'south',
}

/** A single sector within a tile */
export interface ISectorOnTile {
  starName: EStarName;
  color: ESector;
}

/** Canonical definition of a physical sector tile (2 sectors per tile) */
export interface ISectorTileDefinition {
  tileId: ESectorTileId;
  sectors: readonly [ISectorOnTile, ISectorOnTile];
}

/**
 * A tile placed at a board position, with explicit links to
 * the runtime `IPublicSectorState.sectorId` values.
 */
export interface ISectorTilePlacement {
  tileId: ESectorTileId;
  position: ESectorPosition;
  sectorIds: [string, string];
}

/**
 * Full solar system setup config — created by the server at game init,
 * sent to the client as part of the game state.
 */
export interface ISolarSystemSetupConfig {
  tilePlacements: ISectorTilePlacement[];
  initialDiscAngles: [number, number, number];
}

// ---------------------------------------------------------------------------
// Canonical tile data
// ---------------------------------------------------------------------------

export const SECTOR_TILE_DEFINITIONS: Readonly<
  Record<ESectorTileId, ISectorTileDefinition>
> = {
  [ESectorTileId.TILE_1]: {
    tileId: ESectorTileId.TILE_1,
    sectors: [
      { starName: EStarName.PROCYON, color: ESector.BLUE },
      { starName: EStarName.VEGA, color: ESector.BLACK },
    ],
  },
  [ESectorTileId.TILE_2]: {
    tileId: ESectorTileId.TILE_2,
    sectors: [
      { starName: EStarName.SIRIUS_A, color: ESector.BLUE },
      { starName: EStarName.BARNARDS_STAR, color: ESector.RED },
    ],
  },
  [ESectorTileId.TILE_3]: {
    tileId: ESectorTileId.TILE_3,
    sectors: [
      { starName: EStarName.KEPLER_22, color: ESector.YELLOW },
      { starName: EStarName.PROXIMA_CENTAURI, color: ESector.RED },
    ],
  },
  [ESectorTileId.TILE_4]: {
    tileId: ESectorTileId.TILE_4,
    sectors: [
      { starName: EStarName.SIXTY_ONE_VIRGINIS, color: ESector.YELLOW },
      { starName: EStarName.BETA_PICTORIS, color: ESector.BLACK },
    ],
  },
};

export const ALL_SECTOR_TILE_IDS = [
  ESectorTileId.TILE_1,
  ESectorTileId.TILE_2,
  ESectorTileId.TILE_3,
  ESectorTileId.TILE_4,
] as const;

export const ALL_SECTOR_POSITIONS = [
  ESectorPosition.NORTH,
  ESectorPosition.WEST,
  ESectorPosition.EAST,
  ESectorPosition.SOUTH,
] as const;

/** Rotation is quantized to 8 steps of 45° each */
export const ROTATION_STEPS_PER_RING = 8;

export const DEGREES_PER_STEP = 360 / ROTATION_STEPS_PER_RING; // 45

// ---------------------------------------------------------------------------
// Helpers — usable by both server and client
// ---------------------------------------------------------------------------

export function getSectorsFromTile(
  tileId: ESectorTileId,
): readonly [ISectorOnTile, ISectorOnTile] {
  return SECTOR_TILE_DEFINITIONS[tileId].sectors;
}

export function getSectorTileImageSrc(tileId: ESectorTileId): string {
  return `/assets/seti/sectors/sector${tileId}.png`;
}

export interface IResolvedTilePlacement {
  tileId: ESectorTileId;
  position: ESectorPosition;
  sectorIds: [string, string];
  imageSrc: string;
  sectors: readonly [ISectorOnTile, ISectorOnTile];
}

export function resolveSetupConfig(
  config: ISolarSystemSetupConfig,
): IResolvedTilePlacement[] {
  return config.tilePlacements.map((placement) => ({
    tileId: placement.tileId,
    position: placement.position,
    sectorIds: placement.sectorIds,
    imageSrc: getSectorTileImageSrc(placement.tileId),
    sectors: getSectorsFromTile(placement.tileId),
  }));
}

/** Create the canonical (non-randomized) default setup */
export function createDefaultSetupConfig(): ISolarSystemSetupConfig {
  return {
    tilePlacements: [
      {
        tileId: ESectorTileId.TILE_1,
        position: ESectorPosition.NORTH,
        sectorIds: ['sector-0', 'sector-1'],
      },
      {
        tileId: ESectorTileId.TILE_2,
        position: ESectorPosition.WEST,
        sectorIds: ['sector-2', 'sector-3'],
      },
      {
        tileId: ESectorTileId.TILE_3,
        position: ESectorPosition.EAST,
        sectorIds: ['sector-4', 'sector-5'],
      },
      {
        tileId: ESectorTileId.TILE_4,
        position: ESectorPosition.SOUTH,
        sectorIds: ['sector-6', 'sector-7'],
      },
    ],
    initialDiscAngles: [0, 0, 0],
  };
}

/**
 * Normalize a disc angle to the canonical 0..ROTATION_STEPS_PER_RING-1 range.
 * Works for negative values too (e.g., -1 → 7).
 */
export function normalizeDiscAngle(angle: number): number {
  return (
    ((angle % ROTATION_STEPS_PER_RING) + ROTATION_STEPS_PER_RING) %
    ROTATION_STEPS_PER_RING
  );
}
