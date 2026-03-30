import { ESector, ETrace } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';

type TFixed4<T> = [T, T, T, T];
type TFixed8<T> = [T, T, T, T, T, T, T, T];

export type TSolarSystemMapCellType =
  | 'NULL'
  | 'EMPTY'
  | 'ASTEROID'
  | 'COMET'
  | 'EARTH'
  | 'PLANET';

/** Static map data for one slot on a wheel. */
export interface ISolarSystemWheelMapCell {
  type: TSolarSystemMapCellType;
  hasPublicityIcon: boolean;
  planet?: EPlanet;
}

/** Runtime elements that can occupy a wheel slot (probe, marker, etc). */
export interface ISolarSystemWheelRuntimeElement {
  type: string;
  playerId?: string;
  [key: string]: unknown;
}

/** Each wheel slot always has static map data + runtime elements. */
export interface ISolarSystemWheelCell {
  cell: ISolarSystemWheelMapCell;
  elements: ISolarSystemWheelRuntimeElement[];
}

/** A wheel is always 4 rows * 8 slots. */
export type TSolarSystemWheelGrid = TFixed4<TFixed8<ISolarSystemWheelCell>>;

export type TSolarSystemWheelIndex = 1 | 2 | 3 | 4;

export type TSolarSystemWheels = Record<
  TSolarSystemWheelIndex,
  TSolarSystemWheelGrid
>;

interface IWheelSlotDefinition {
  type: TSolarSystemMapCellType;
  planet?: EPlanet;
  hasPublicityIcon?: boolean;
}

function createWheelCell(
  definition: IWheelSlotDefinition,
): ISolarSystemWheelCell {
  return {
    cell: {
      type: definition.type,
      hasPublicityIcon: Boolean(definition.hasPublicityIcon),
      planet: definition.planet,
    },
    elements: [],
  };
}

/**
 * Input order is SETI rulebook style: slot 1..8.
 * Internal index order is 0..7, where slot-8 maps to index-0.
 */
function createWheelRow(
  slotsByRulebookOrder: TFixed8<IWheelSlotDefinition>,
): TFixed8<ISolarSystemWheelCell> {
  const row = new Array<ISolarSystemWheelCell>(8);
  for (let slotNumber = 1; slotNumber <= 8; slotNumber += 1) {
    const internalIndex = slotNumber === 8 ? 0 : slotNumber;
    row[internalIndex] = createWheelCell(slotsByRulebookOrder[slotNumber - 1]);
  }

  return row as TFixed8<ISolarSystemWheelCell>;
}

function cloneWheelCell(cell: ISolarSystemWheelCell): ISolarSystemWheelCell {
  return {
    cell: {
      type: cell.cell.type,
      hasPublicityIcon: cell.cell.hasPublicityIcon,
      planet: cell.cell.planet,
    },
    elements: cell.elements.map((element) => ({ ...element })),
  };
}

function cloneWheelGrid(grid: TSolarSystemWheelGrid): TSolarSystemWheelGrid {
  return grid.map((row) => row.map(cloneWheelCell)) as TSolarSystemWheelGrid;
}

const NULL_SLOT: IWheelSlotDefinition = { type: 'NULL' };
const EMPTY_SLOT: IWheelSlotDefinition = { type: 'EMPTY' };
const ASTEROID_SLOT: IWheelSlotDefinition = { type: 'ASTEROID' };
const EARTH_SLOT: IWheelSlotDefinition = {
  type: 'EARTH',
  planet: EPlanet.EARTH,
};

function planetSlot(planet: EPlanet): IWheelSlotDefinition {
  return {
    type: 'PLANET',
    planet,
    hasPublicityIcon: true,
  };
}

function cometSlotWithPublicity(): IWheelSlotDefinition {
  return {
    type: 'COMET',
    hasPublicityIcon: true,
  };
}

const DEFAULT_SOLAR_SYSTEM_WHEELS_TEMPLATE: TSolarSystemWheels = {
  1: [
    createWheelRow([
      planetSlot(EPlanet.MERCURY),
      EMPTY_SLOT,
      planetSlot(EPlanet.VENUS),
      NULL_SLOT,
      EARTH_SLOT,
      EMPTY_SLOT,
      NULL_SLOT,
      NULL_SLOT,
    ]),
    createWheelRow([
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
    ]),
    createWheelRow([
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
    ]),
    createWheelRow([
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
    ]),
  ],
  2: [
    createWheelRow([
      NULL_SLOT,
      EMPTY_SLOT,
      ASTEROID_SLOT,
      EMPTY_SLOT,
      ASTEROID_SLOT,
      EMPTY_SLOT,
      NULL_SLOT,
      NULL_SLOT,
    ]),
    createWheelRow([
      NULL_SLOT,
      planetSlot(EPlanet.MARS),
      NULL_SLOT,
      NULL_SLOT,
      EMPTY_SLOT,
      ASTEROID_SLOT,
      NULL_SLOT,
      NULL_SLOT,
    ]),
    createWheelRow([
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
    ]),
    createWheelRow([
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
    ]),
  ],
  3: [
    createWheelRow([
      cometSlotWithPublicity(),
      ASTEROID_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      EMPTY_SLOT,
      ASTEROID_SLOT,
      ASTEROID_SLOT,
      EMPTY_SLOT,
    ]),
    createWheelRow([
      NULL_SLOT,
      EMPTY_SLOT,
      NULL_SLOT,
      ASTEROID_SLOT,
      EMPTY_SLOT,
      NULL_SLOT,
      ASTEROID_SLOT,
      cometSlotWithPublicity(),
    ]),
    createWheelRow([
      NULL_SLOT,
      EMPTY_SLOT,
      planetSlot(EPlanet.JUPITER),
      EMPTY_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      planetSlot(EPlanet.SATURN),
      NULL_SLOT,
    ]),
    createWheelRow([
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
      NULL_SLOT,
    ]),
  ],
  4: [
    createWheelRow([
      cometSlotWithPublicity(),
      EMPTY_SLOT,
      ASTEROID_SLOT,
      ASTEROID_SLOT,
      EMPTY_SLOT,
      cometSlotWithPublicity(),
      cometSlotWithPublicity(),
      ASTEROID_SLOT,
    ]),
    createWheelRow([
      cometSlotWithPublicity(),
      ASTEROID_SLOT,
      EMPTY_SLOT,
      cometSlotWithPublicity(),
      EMPTY_SLOT,
      ASTEROID_SLOT,
      EMPTY_SLOT,
      EMPTY_SLOT,
    ]),
    createWheelRow([
      ASTEROID_SLOT,
      cometSlotWithPublicity(),
      ASTEROID_SLOT,
      ASTEROID_SLOT,
      EMPTY_SLOT,
      EMPTY_SLOT,
      ASTEROID_SLOT,
      EMPTY_SLOT,
    ]),
    createWheelRow([
      EMPTY_SLOT,
      EMPTY_SLOT,
      planetSlot(EPlanet.NEPTUNE),
      EMPTY_SLOT,
      cometSlotWithPublicity(),
      EMPTY_SLOT,
      cometSlotWithPublicity(),
      planetSlot(EPlanet.URANUS),
    ]),
  ],
};

export function createDefaultSolarSystemWheels(): TSolarSystemWheels {
  return {
    1: cloneWheelGrid(DEFAULT_SOLAR_SYSTEM_WHEELS_TEMPLATE[1]),
    2: cloneWheelGrid(DEFAULT_SOLAR_SYSTEM_WHEELS_TEMPLATE[2]),
    3: cloneWheelGrid(DEFAULT_SOLAR_SYSTEM_WHEELS_TEMPLATE[3]),
    4: cloneWheelGrid(DEFAULT_SOLAR_SYSTEM_WHEELS_TEMPLATE[4]),
  };
}

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
  wheels: TSolarSystemWheels;
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

// ---------------------------------------------------------------------------
// Sector winner bonus & per-star config
// ---------------------------------------------------------------------------

export type TSectorWinnerBonusItem =
  | { type: 'trace'; trace: ETrace }
  | { type: 'vp'; amount: number };

export type TSectorWinnerBonus = readonly TSectorWinnerBonusItem[];

export interface ISectorStarConfig {
  dataSlotCapacity: number;
  firstWinBonus: TSectorWinnerBonus;
  repeatWinBonus: TSectorWinnerBonus;
}

const TRACE_RED: TSectorWinnerBonusItem = { type: 'trace', trace: ETrace.RED };
const VP3: TSectorWinnerBonusItem = { type: 'vp', amount: 3 };

export const SECTOR_STAR_CONFIGS: Readonly<
  Record<EStarName, ISectorStarConfig>
> = {
  [EStarName.PROCYON]: {
    dataSlotCapacity: 5,
    firstWinBonus: [TRACE_RED],
    repeatWinBonus: [VP3],
  },
  [EStarName.VEGA]: {
    dataSlotCapacity: 4,
    firstWinBonus: [TRACE_RED, { type: 'vp', amount: 2 }],
    repeatWinBonus: [{ type: 'vp', amount: 5 }],
  },
  [EStarName.SIRIUS_A]: {
    dataSlotCapacity: 6,
    firstWinBonus: [TRACE_RED],
    repeatWinBonus: [TRACE_RED],
  },
  [EStarName.BARNARDS_STAR]: {
    dataSlotCapacity: 5,
    firstWinBonus: [TRACE_RED],
    repeatWinBonus: [VP3],
  },
  [EStarName.KEPLER_22]: {
    dataSlotCapacity: 5,
    firstWinBonus: [TRACE_RED],
    repeatWinBonus: [VP3],
  },
  [EStarName.PROXIMA_CENTAURI]: {
    dataSlotCapacity: 6,
    firstWinBonus: [TRACE_RED],
    repeatWinBonus: [TRACE_RED],
  },
  [EStarName.SIXTY_ONE_VIRGINIS]: {
    dataSlotCapacity: 6,
    firstWinBonus: [TRACE_RED],
    repeatWinBonus: [TRACE_RED],
  },
  [EStarName.BETA_PICTORIS]: {
    dataSlotCapacity: 5,
    firstWinBonus: [TRACE_RED, VP3],
    repeatWinBonus: [TRACE_RED],
  },
};

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
    wheels: createDefaultSolarSystemWheels(),
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
