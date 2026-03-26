import type { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { type ISolarSystemSpace, SolarSystem } from './SolarSystem.js';
import {
  SOLAR_SYSTEM_CELL_CONFIGS,
  SOLAR_SYSTEM_NEAR_STAR_POOL,
} from './SolarSystemConfig.js';

export class BoardBuilder {
  public static buildSolarSystem(random: SeededRandom): SolarSystem {
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

    const nearStars = random.shuffle(SOLAR_SYSTEM_NEAR_STAR_POOL).slice(0, 8);
    this.assertValidSectorNearStarLayout(nearStars);

    return new SolarSystem(spaces, nearStars);
  }

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
