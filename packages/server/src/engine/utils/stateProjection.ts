import type {
  IPublicSolarSystemSpaceState,
  IPublicSolarSystemState,
} from '@seti/common/types/protocol/gameState';
import type { SolarSystem } from '../board/SolarSystem.js';

export function toPublicSolarSystemState(
  ss: SolarSystem,
): IPublicSolarSystemState {
  const adjacencyRecord: Record<string, string[]> = {};
  for (const [spaceId, neighbors] of ss.adjacency.entries()) {
    adjacencyRecord[spaceId] = [...neighbors];
  }

  const spaceStates: Record<string, IPublicSolarSystemSpaceState> = {};
  for (const space of ss.spaces) {
    spaceStates[space.id] = {
      spaceId: space.id,
      ringIndex: space.ringIndex,
      indexInRing: space.indexInRing,
      hasPublicityIcon: space.hasPublicityIcon,
      elementTypes: space.elements.map((e) => e.type),
    };
  }

  return {
    spaces: ss.spaces.map((s) => s.id),
    adjacency: adjacencyRecord,
    probes: ss.spaces.flatMap((space) =>
      space.occupants.map((probe) => ({
        playerId: probe.playerId,
        spaceId: space.id,
      })),
    ),
    discs: ss.discs.map((disc) => ({
      discIndex: disc.index,
      angle: disc.currentRotation,
    })),
    spaceStates,
  };
}
