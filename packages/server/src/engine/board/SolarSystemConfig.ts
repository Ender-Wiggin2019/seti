import { SOLAR_SYSTEM_PLANETS } from '@seti/common/constant/boardLayout';
import {
  createDefaultSolarSystemExpandedMapCells,
  type ISolarSystemWheelMapCell,
} from '@seti/common/constant/sectorSetup';
import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  ESolarSystemElementType,
  type ISolarSystemElement,
} from './SolarSystemTypes.js';

const RING_DISC_INDEXES: ReadonlyArray<number | null> = [0, 1, 2, null];

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
  planetSpaceIds: Readonly<Partial<Record<EPlanet, string>>>;
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

  for (const expandedCell of createDefaultSolarSystemExpandedMapCells()) {
    const mapCell = expandedCell.cell;
    const elements = [toElement(mapCell)];
    const hasPublicityIcon =
      mapCell.hasPublicityIcon && mapCell.type !== 'EARTH';

    if (mapCell.type === 'NULL') {
      cutoutSpaceIds.push(expandedCell.id);
    }

    if (hasPublicityIcon) {
      publicitySpaceIds.push(expandedCell.id);
    }

    if (mapCell.planet !== undefined) {
      planetSpaceIdsMutable[mapCell.planet] = expandedCell.id;
    }

    cells.push({
      id: expandedCell.id,
      ringIndex: expandedCell.ringIndex,
      indexInRing: expandedCell.indexInRing,
      discIndex: RING_DISC_INDEXES[expandedCell.ringIndex - 1],
      elements,
      hasPublicityIcon,
    });
  }

  const missingPlanets = SOLAR_SYSTEM_PLANETS.filter(
    (planet) => planetSpaceIdsMutable[planet] === undefined,
  );
  if (missingPlanets.length > 0) {
    throw new Error(
      `Missing planet positions for: ${missingPlanets.join(', ')}`,
    );
  }

  return {
    cells,
    planetSpaceIds: planetSpaceIdsMutable as Readonly<
      Partial<Record<EPlanet, string>>
    >,
    cutoutSpaceIds,
    publicitySpaceIds,
  };
}

function toElement(cell: ISolarSystemWheelMapCell): ISolarSystemElement {
  if (cell.type === 'EMPTY') {
    return { type: ESolarSystemElementType.EMPTY, amount: 1 };
  }
  if (cell.type === 'NULL') {
    return { type: ESolarSystemElementType.NULL, amount: 1 };
  }
  if (cell.type === 'ASTEROID') {
    return { type: ESolarSystemElementType.ASTEROID, amount: 1 };
  }
  if (cell.type === 'COMET') {
    return { type: ESolarSystemElementType.COMET, amount: 1 };
  }

  if (cell.type === 'EARTH' && cell.planet === EPlanet.EARTH) {
    return {
      type: ESolarSystemElementType.EARTH,
      amount: 1,
      planet: cell.planet,
    };
  }

  if (cell.type === 'PLANET' && cell.planet !== undefined) {
    return {
      type: ESolarSystemElementType.PLANET,
      amount: 1,
      planet: cell.planet,
    };
  }

  throw new Error(`Unknown solar system cell: ${cell.type}`);
}
