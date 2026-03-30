import {
  ALL_SECTOR_POSITIONS,
  ALL_SECTOR_TILE_IDS,
  createDefaultSolarSystemWheels,
  type ESectorPosition,
  type ESectorTileId,
  type EStarName,
  type ISectorTilePlacement,
  type ISolarSystemSetupConfig,
  ROTATION_STEPS_PER_RING,
  SECTOR_STAR_CONFIGS,
  SECTOR_TILE_DEFINITIONS,
} from '@seti/common/constant/sectorSetup';
import type { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { type ISectorInit, Sector } from './Sector.js';
import { type ISolarSystemSpace, SolarSystem } from './SolarSystem.js';
import { SOLAR_SYSTEM_CELL_CONFIGS } from './SolarSystemConfig.js';

export interface IBoardBuildResult {
  solarSystem: SolarSystem;
  sectors: Sector[];
  setupConfig: ISolarSystemSetupConfig;
}

export class BoardBuilder {
  public static buildAll(random: SeededRandom): IBoardBuildResult {
    const tilePlacements = this.randomizeTilePlacements(random);
    const initialDiscAngles = this.randomizeDiscAngles(random);

    const setupConfig: ISolarSystemSetupConfig = {
      tilePlacements,
      initialDiscAngles,
      wheels: createDefaultSolarSystemWheels(),
    };

    const nearStars = tilePlacements.flatMap((placement) => {
      const tileDef = SECTOR_TILE_DEFINITIONS[placement.tileId];
      return tileDef.sectors.map((s) => s.starName);
    });

    const solarSystem = this.buildSolarSystem(nearStars, initialDiscAngles);

    const sectors = this.buildSectorsFromPlacements(tilePlacements);

    return { solarSystem, sectors, setupConfig };
  }

  /**
   * Quick factory used by tests — runs full buildAll and returns only the SolarSystem.
   */
  public static buildSolarSystemFromRandom(random: SeededRandom): SolarSystem {
    return this.buildAll(random).solarSystem;
  }

  public static buildSolarSystem(
    nearStars: readonly string[],
    initialDiscAngles: [number, number, number] = [0, 0, 0],
  ): SolarSystem {
    const spaces: ISolarSystemSpace[] = SOLAR_SYSTEM_CELL_CONFIGS.map(
      (cell) => ({
        id: cell.id,
        ringIndex: cell.ringIndex,
        indexInRing: cell.indexInRing,
        discIndex: cell.discIndex,
        hasPublicityIcon: cell.hasPublicityIcon,
        elements: cell.elements.map((element) => ({ ...element })),
        occupants: [],
      }),
    );

    return new SolarSystem(spaces, [...nearStars], initialDiscAngles);
  }

  public static randomizeTilePlacements(
    random: SeededRandom,
  ): ISectorTilePlacement[] {
    const shuffledTileIds = random.shuffle([
      ...ALL_SECTOR_TILE_IDS,
    ]) as ESectorTileId[];
    const positions = [...ALL_SECTOR_POSITIONS] as ESectorPosition[];

    let sectorCounter = 0;
    return shuffledTileIds.map((tileId, idx) => {
      const sectorId0 = `sector-${sectorCounter}`;
      const sectorId1 = `sector-${sectorCounter + 1}`;
      sectorCounter += 2;
      return {
        tileId,
        position: positions[idx],
        sectorIds: [sectorId0, sectorId1] as [string, string],
      };
    });
  }

  public static randomizeDiscAngles(
    random: SeededRandom,
  ): [number, number, number] {
    return [
      Math.floor(random.next() * ROTATION_STEPS_PER_RING),
      Math.floor(random.next() * ROTATION_STEPS_PER_RING),
      Math.floor(random.next() * ROTATION_STEPS_PER_RING),
    ];
  }

  public static buildSectorsFromPlacements(
    tilePlacements: ISectorTilePlacement[],
  ): Sector[] {
    const sectors: Sector[] = [];

    for (const placement of tilePlacements) {
      const tileDef = SECTOR_TILE_DEFINITIONS[placement.tileId];

      for (let idx = 0; idx < tileDef.sectors.length; idx += 1) {
        const sectorOnTile = tileDef.sectors[idx];
        const starConfig =
          SECTOR_STAR_CONFIGS[sectorOnTile.starName as EStarName];

        const init: ISectorInit = {
          id: placement.sectorIds[idx],
          color: sectorOnTile.color,
          dataSlotCapacity: starConfig?.dataSlotCapacity,
          firstWinBonus: starConfig?.firstWinBonus,
          repeatWinBonus: starConfig?.repeatWinBonus,
        };
        sectors.push(new Sector(init));
      }
    }

    return sectors;
  }

  /** @deprecated Legacy validation — still used by older code paths */
  private static assertValidSectorNearStarLayout(
    nearStars: readonly string[],
  ): void {
    if (nearStars.length !== 8) {
      throw new Error(`Expected 8 sectors, got ${nearStars.length}`);
    }

    const uniqueStars = new Set(nearStars);
    if (uniqueStars.size !== 8) {
      throw new Error(
        'Every sector must map to exactly one unique nearby star',
      );
    }
  }
}
