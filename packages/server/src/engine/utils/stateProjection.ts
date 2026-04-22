import {
  SECTOR_COUNT,
  sectorIndexOf,
} from '@seti/common/constant/solarCoordinate';
import type { EPlanet } from '@seti/common/types/protocol/enums';
import type {
  IPublicSolarSystemProbe,
  IPublicSolarSystemSpaceState,
  IPublicSolarSystemState,
} from '@seti/common/types/protocol/gameState';
import { ESolarSystemElementType, type SolarSystem } from '../board/SolarSystem.js';

export function toPublicSolarSystemState(
  ss: SolarSystem,
): IPublicSolarSystemState {
  const adjacencyRecord: Record<string, string[]> = {};
  for (const [spaceId, neighbors] of ss.adjacency.entries()) {
    adjacencyRecord[spaceId] = [...neighbors];
  }

  const spaceStates: Record<string, IPublicSolarSystemSpaceState> = {};
  const sectorSpaceIds: Record<number, string[]> = {};
  for (let s = 0; s < SECTOR_COUNT; s += 1) {
    sectorSpaceIds[s] = [];
  }

  const planetSpaceIds: Partial<Record<EPlanet, string>> = {};

  for (const space of ss.spaces) {
    const hasCoord = space.ringIndex >= 1 && space.ringIndex <= 4;
    const sectorIndex = hasCoord
      ? sectorIndexOf(space.ringIndex, space.indexInRing)
      : undefined;
    const cellInSector = hasCoord
      ? space.indexInRing % space.ringIndex
      : undefined;

    spaceStates[space.id] = {
      spaceId: space.id,
      ringIndex: space.ringIndex,
      indexInRing: space.indexInRing,
      hasPublicityIcon: space.hasPublicityIcon,
      elementTypes: space.elements.map((e) => e.type),
      elements: space.elements.map((e) => ({ type: e.type, planet: e.planet })),
      sectorIndex,
      cellInSector,
    };

    if (sectorIndex !== undefined) {
      sectorSpaceIds[sectorIndex].push(space.id);
    }

    for (const element of space.elements) {
      if (
        (element.type === ESolarSystemElementType.PLANET ||
          element.type === ESolarSystemElementType.EARTH) &&
        element.planet !== undefined &&
        element.amount > 0
      ) {
        planetSpaceIds[element.planet] = space.id;
      }
    }
  }

  for (const list of Object.values(sectorSpaceIds)) {
    list.sort((a, b) => {
      const sa = spaceStates[a];
      const sb = spaceStates[b];
      if (sa.ringIndex !== sb.ringIndex) return sa.ringIndex - sb.ringIndex;
      return sa.indexInRing - sb.indexInRing;
    });
  }

  const probes: IPublicSolarSystemProbe[] = [];
  const probeSpaceById: Record<string, string> = {};

  for (const space of ss.spaces) {
    for (const probe of space.occupants) {
      probes.push({
        playerId: probe.playerId,
        spaceId: space.id,
        probeId: probe.id,
      });
      probeSpaceById[probe.id] = space.id;
    }
  }

  return {
    spaces: ss.spaces.map((s) => s.id),
    adjacency: adjacencyRecord,
    probes,
    discs: ss.discs.map((disc) => ({
      discIndex: disc.index,
      angle: disc.currentRotation,
    })),
    nextRotateRing: ((ss.rotationCounter % ss.discs.length) + 1) as 1 | 2 | 3,
    spaceStates,
    planetSpaceIds,
    sectorSpaceIds,
    probeSpaceById,
  };
}
