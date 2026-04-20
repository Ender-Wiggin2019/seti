import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  ESolarSystemElementType,
  type ISolarSystemElement,
} from './SolarSystem.js';

const SECTOR_COUNT = 8;
const RING_CELL_COUNTS = [8, 16, 24, 32] as const;
const RING_DISC_INDEXES: ReadonlyArray<number | null> = [0, 1, 2, null];

const WHEEL_LEVEL_1 = [
  ['⚫'],
  ['VENUS'],
  ['O'],
  ['EARTH'],
  ['⚫'],
  ['O'],
  ['O'],
  ['MERCURY'],
] as const;
const WHEEL_LEVEL_2 = [
  ['⚫', 'O'],
  ['🪨', '⚫'],
  ['⚫', '🪨'],
  ['O', 'O'],
  ['O', 'O'],
  ['O', 'O'],
  ['⚫', 'MARS'],
  ['🪨', 'O'],
] as const;
const WHEEL_LEVEL_3 = [
  ['🪨', 'O', 'O'],
  ['🪨', '🪨', 'SATURN'],
  ['⚫', '⭐', 'O'],
  ['⭐', 'O', 'O'],
  ['🪨', '⚫', '⚫'],
  ['O', 'O', 'JUPITER'],
  ['O', '🪨', '⚫'],
  ['⚫', '⚫', 'O'],
] as const;
const WHEEL_LEVEL_4 = [
  ['⭐', '⭐', '🪨', '⚫'],
  ['⚫', '🪨', '⭐', '⚫'],
  ['🪨', '⚫', '🪨', 'NEPTUNE'],
  ['🪨', '⭐', '🪨', '⚫'],
  ['⚫', '⚫', '⚫', '⭐'],
  ['⭐', '🪨', '⚫', '⚫'],
  ['⭐', '⚫', '🪨', '⭐'],
  ['🪨', '⚫', '⚫', 'URANUS'],
] as const;

const PLANET_TOKEN_MAP: Readonly<Record<string, EPlanet>> = {
  EARTH: EPlanet.EARTH,
  MERCURY: EPlanet.MERCURY,
  VENUS: EPlanet.VENUS,
  MARS: EPlanet.MARS,
  JUPITER: EPlanet.JUPITER,
  SATURN: EPlanet.SATURN,
  URANUS: EPlanet.URANUS,
  NEPTUNE: EPlanet.NEPTUNE,
};

export const SOLAR_SYSTEM_NEAR_STAR_POOL = [
  '61Virginis',
  'BetaPictoris',
  'Procryon',
  'Vega',
  'SiriusA',
  'Bernard',
  'Kepler22',
  'ProximaCentauri',
] as const;

export interface ISolarSystemCellConfig {
  id: string;
  ringIndex: number;
  indexInRing: number;
  discIndex: number | null;
  elements: ISolarSystemElement[];
  hasPublicityIcon: boolean;
  /**
   * Optional amount for the printed publicity icon on this cell. Defaults
   * to `1` when omitted, matching the base-game board. Set a value `> 1`
   * to model future "+2"/"+3" publicity icons without introducing a new
   * type.
   */
  publicityIconAmount?: number;
}

interface IBuildResult {
  cells: ISolarSystemCellConfig[];
  planetSpaceIds: Readonly<Record<EPlanet, string>>;
  cutoutSpaceIds: readonly string[];
  publicitySpaceIds: readonly string[];
}

const REAL_CONFIG = buildRealConfig();

export const SOLAR_SYSTEM_CELL_CONFIGS = REAL_CONFIG.cells;
export const SOLAR_SYSTEM_PLANET_SPACE_IDS = REAL_CONFIG.planetSpaceIds;
export const SOLAR_SYSTEM_CUTOUT_SPACE_IDS = REAL_CONFIG.cutoutSpaceIds;
export const SOLAR_SYSTEM_PUBLICITY_SPACE_IDS = REAL_CONFIG.publicitySpaceIds;

function buildRealConfig(): IBuildResult {
  const cells: ISolarSystemCellConfig[] = [];
  const cutoutSpaceIds: string[] = [];
  const publicitySpaceIds: string[] = [];
  const planetSpaceIdsMutable: Partial<Record<EPlanet, string>> = {};

  for (
    let ringOffset = 0;
    ringOffset < RING_CELL_COUNTS.length;
    ringOffset += 1
  ) {
    const ringIndex = ringOffset + 1;
    const ringCellCount = RING_CELL_COUNTS[ringOffset];
    const cellsPerSector = ringCellCount / SECTOR_COUNT;
    for (let sectorIndex = 0; sectorIndex < SECTOR_COUNT; sectorIndex += 1) {
      const symbol = resolveLayerSymbol(ringIndex, sectorIndex);
      for (
        let sectorCellOffset = 0;
        sectorCellOffset < cellsPerSector;
        sectorCellOffset += 1
      ) {
        const indexInRing = sectorIndex * cellsPerSector + sectorCellOffset;
        const id = `ring-${ringIndex}-cell-${indexInRing}`;
        const isAnchorCell = sectorCellOffset === 0;

        let elements: ISolarSystemElement[] = [
          { type: ESolarSystemElementType.EMPTY, amount: 1 },
        ];
        if (symbol === 'O') {
          elements = [{ type: ESolarSystemElementType.NULL, amount: 1 }];
          cutoutSpaceIds.push(id);
        } else if (isAnchorCell) {
          elements = [toElement(symbol)];
        }

        const hasPublicityIcon =
          isAnchorCell && isPublicitySymbol(symbol) && symbol !== 'EARTH';
        if (hasPublicityIcon) {
          publicitySpaceIds.push(id);
        }

        const planet = PLANET_TOKEN_MAP[symbol];
        if (isAnchorCell && planet !== undefined) {
          planetSpaceIdsMutable[planet] = id;
        }

        cells.push({
          id,
          ringIndex,
          indexInRing,
          discIndex: RING_DISC_INDEXES[ringOffset],
          elements,
          hasPublicityIcon,
        });
      }
    }
  }

  const missingPlanets = Object.values(EPlanet).filter(
    (planet) => planetSpaceIdsMutable[planet] === undefined,
  );
  if (missingPlanets.length > 0) {
    throw new Error(
      `Missing planet positions for: ${missingPlanets.join(', ')}`,
    );
  }

  return {
    cells,
    planetSpaceIds: planetSpaceIdsMutable as Readonly<Record<EPlanet, string>>,
    cutoutSpaceIds,
    publicitySpaceIds,
  };
}

function resolveLayerSymbol(ringIndex: number, sectorIndex: number): string {
  if (ringIndex === 1) {
    return WHEEL_LEVEL_1[sectorIndex][0] ?? 'O';
  }
  if (ringIndex === 2) {
    return WHEEL_LEVEL_2[sectorIndex][1] ?? 'O';
  }
  if (ringIndex === 3) {
    return WHEEL_LEVEL_3[sectorIndex][2] ?? 'O';
  }
  if (ringIndex === 4) {
    return WHEEL_LEVEL_4[sectorIndex][3] ?? 'O';
  }

  return 'O';
}

function toElement(symbol: string): ISolarSystemElement {
  if (symbol === '⚫') {
    return { type: ESolarSystemElementType.EMPTY, amount: 1 };
  }
  if (symbol === '🪨') {
    return { type: ESolarSystemElementType.ASTEROID, amount: 1 };
  }
  if (symbol === '⭐') {
    return { type: ESolarSystemElementType.COMET, amount: 1 };
  }

  const planet = PLANET_TOKEN_MAP[symbol];
  if (planet !== undefined) {
    if (planet === EPlanet.EARTH) {
      return { type: ESolarSystemElementType.EARTH, amount: 1, planet };
    }
    return { type: ESolarSystemElementType.PLANET, amount: 1, planet };
  }

  throw new Error(`Unknown solar system symbol: ${symbol}`);
}

function isPublicitySymbol(symbol: string): boolean {
  return symbol !== 'O' && symbol !== '⚫';
}
