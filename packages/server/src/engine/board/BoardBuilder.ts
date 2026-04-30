import type {
  ISectorTilePlacement,
  ISolarSystemSetupConfig,
} from '@seti/common/constant/sectorSetup';
import type { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { Sector } from './Sector.js';
import { SolarSystem } from './SolarSystem.js';

export interface IBoardBuildResult {
  solarSystem: SolarSystem;
  sectors: Sector[];
  setupConfig: ISolarSystemSetupConfig;
}

/**
 * Thin facade around {@link SolarSystem.init}. Historically this class
 * owned the randomization + construction logic; it now only delegates.
 * Kept for back-compat with existing callers (tests, GameSetup).
 */
export class BoardBuilder {
  public static buildAll(random: SeededRandom): IBoardBuildResult {
    return SolarSystem.init(random);
  }

  /** Quick factory used by tests — returns only the SolarSystem. */
  public static buildSolarSystemFromRandom(random: SeededRandom): SolarSystem {
    return SolarSystem.init(random).solarSystem;
  }

  public static buildSolarSystem(
    nearStars: readonly string[],
    initialDiscAngles: [number, number, number] = [0, 0, 0],
  ): SolarSystem {
    // Back-compat: derive a tile-less setup from the near-star order.
    // Callers that still use this path only care about ring topology +
    // disc angles; we synthesize placeholder tile placements so new
    // consumers (`game.solarSystemSetup`) keep working.
    return SolarSystem.init(nullRandom(), {
      initialDiscAngles,
      tilePlacements: synthesizeTilePlacements(nearStars),
    }).solarSystem;
  }

  public static randomizeTilePlacements(
    random: SeededRandom,
  ): ISectorTilePlacement[] {
    return SolarSystem.randomizeTilePlacements(random);
  }

  public static randomizeDiscAngles(
    random: SeededRandom,
  ): [number, number, number] {
    return SolarSystem.randomizeDiscAngles(random);
  }

  public static buildSectorsFromPlacements(
    tilePlacements: ISectorTilePlacement[],
  ): Sector[] {
    return SolarSystem.init(nullRandom(), { tilePlacements }).sectors;
  }
}

function nullRandom(): SeededRandom {
  // We pass `opts` that cover every randomized axis so the RNG is never
  // consulted. Still require a SeededRandom instance to satisfy the API.
  return {
    // biome-ignore lint/suspicious/noExplicitAny: placeholder never read
    next: () => 0 as any,
    nextInt: () => 0,
    shuffle: <T>(items: readonly T[]) => [...items],
  } as unknown as SeededRandom;
}

function synthesizeTilePlacements(
  _nearStars: readonly string[],
): ISectorTilePlacement[] {
  // The legacy `buildSolarSystem(nearStars, angles)` API is only reached
  // from a handful of tests that pre-date the tile model. We always emit
  // the canonical default placements — the 8-star invariant still holds.
  return SolarSystem.randomizeTilePlacements({
    next: () => 0,
    nextInt: () => 0,
    shuffle: <T>(items: readonly T[]) => [...items],
  } as unknown as SeededRandom);
}
