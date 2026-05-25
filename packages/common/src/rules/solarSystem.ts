import type { EPlanet } from '../types/protocol/enums';
import type { IPublicSolarSystemState } from '../types/protocol/gameState';

/**
 * Client-side query helpers over the public solar-system state. Mirror of
 * the `SolarSystem` methods on the server, but operating purely on the
 * serialized DTO so the same code can run in views, effect-preview logic,
 * and unit tests without pulling the server class in.
 *
 * These helpers intentionally use the indexed fields emitted by the server
 * (`planetSpaceIds`, `sectorSpaceIds`, `probeSpaceById`) instead of
 * reconstructing old snapshot shapes from `spaceStates`.
 */

/** Current spaceId carrying `planet`. */
export function findPlanetSpaceId(
  state: IPublicSolarSystemState,
  planet: EPlanet,
): string | null {
  return state.planetSpaceIds?.[planet] ?? null;
}

/** Current sector (0..7) that the given `planet` occupies. */
export function findSectorIndexByPlanet(
  state: IPublicSolarSystemState,
  planet: EPlanet,
): number | null {
  const spaceId = findPlanetSpaceId(state, planet);
  if (!spaceId) return null;
  const coord = state.spaceStates?.[spaceId];
  if (!coord) return null;
  return coord.sectorIndex;
}

/** Ordered ring-1 → ring-4 spaceIds belonging to `sectorIndex`. */
export function getSpaceIdsInSector(
  state: IPublicSolarSystemState,
  sectorIndex: number,
): string[] {
  return state.sectorSpaceIds?.[sectorIndex] ?? [];
}

/**
 * Top-most "covering" space in a sector — the first ring (from ring-1 down)
 * whose top element is NOT NULL. Useful when UIs want to show "the planet
 * / asteroid you actually see in this sector" rather than all four layers.
 */
export function getTopSpaceIdInSector(
  state: IPublicSolarSystemState,
  sectorIndex: number,
): string | null {
  const spaceIds = getSpaceIdsInSector(state, sectorIndex);
  const states = state.spaceStates;
  for (const spaceId of spaceIds) {
    const s = states?.[spaceId];
    if (!s) continue;
    const hasTop =
      s.elementTypes.some((t) => t !== 'NULL') ||
      (s.elements?.some((el) => el.type !== 'NULL') ?? false);
    if (hasTop) return spaceId;
  }
  return null;
}

/** Sector that the probe currently lives in. */
export function findSectorIndexByProbeId(
  state: IPublicSolarSystemState,
  probeId: string,
): number | null {
  const spaceId = state.probeSpaceById?.[probeId] ?? null;
  if (!spaceId) return null;
  const s = state.spaceStates?.[spaceId];
  if (!s) return null;
  return s.sectorIndex;
}

/** Probes currently in the given sector, optionally filtered by playerId. */
export function getProbesInSector(
  state: IPublicSolarSystemState,
  sectorIndex: number,
  filter?: { playerId?: string },
): Array<{ probeId?: string; playerId: string; spaceId: string }> {
  const sectorSpaces = new Set(getSpaceIdsInSector(state, sectorIndex));
  const result: Array<{ probeId?: string; playerId: string; spaceId: string }> =
    [];
  for (const probe of state.probes) {
    if (!sectorSpaces.has(probe.spaceId)) continue;
    if (filter?.playerId && probe.playerId !== filter.playerId) continue;
    result.push({
      probeId: probe.probeId,
      playerId: probe.playerId,
      spaceId: probe.spaceId,
    });
  }
  return result;
}
