import {
  normalizeDiscAngle,
  ROTATION_STEPS_PER_RING,
} from '@seti/common/constant/sectorSetup';
import { EPlanet } from '@seti/common/types/protocol/enums';

export enum ESolarSystemElementType {
  NULL = 'NULL',
  EMPTY = 'EMPTY',
  COMET = 'COMET',
  ASTEROID = 'ASTEROID',
  PLANET = 'PLANET',
  EARTH = 'EARTH',
  SUN = 'SUN',
}

export interface ISolarSystemElement {
  type: ESolarSystemElementType;
  amount: number;
  planet?: EPlanet;
}

export interface ISolarProbe {
  id: string;
  playerId: string;
}

export interface ISolarSystemSpace {
  id: string;
  ringIndex: number;
  indexInRing: number;
  discIndex: number | null;
  hasPublicityIcon: boolean;
  /**
   * Amount of publicity granted when a probe enters via the publicity
   * icon. Optional: when `hasPublicityIcon === true` and this field is
   * omitted, it defaults to `1` (the standard printed icon). Declaring
   * a larger value lets future sector setups print "+2"/"+3" icons
   * without a boolean/number type migration.
   */
  publicityIconAmount?: number;
  elements: ISolarSystemElement[];
  occupants: ISolarProbe[];
}

export interface IDisc {
  index: number;
  currentRotation: number;
  spaces: string[];
}

export interface IProbeMoveResult {
  probeId: string;
  fromId: string;
  toId: string;
  movementCost: number;
  publicityGained: number;
}

interface IRingCoverState {
  before: boolean;
  after: boolean;
}

const RING_CELL_COUNTS = [8, 16, 24, 32] as const;
const DISC_TO_MOVING_RINGS: Readonly<Record<number, readonly number[]>> = {
  0: [1],
  1: [1, 2],
  2: [1, 2, 3],
};
const BASE_MOVE_COST = 1;
const ASTEROID_EXTRA_COST = 1;

export class SolarSystem {
  public readonly spaces: ISolarSystemSpace[];

  public readonly discs: [IDisc, IDisc, IDisc];

  public readonly adjacency: Map<string, string[]>;

  public readonly sectorNearStars: string[];

  public rotationCounter: number;

  private readonly spaceById: Map<string, ISolarSystemSpace>;

  private probeCounter: number;

  private readonly publicityByPlayer: Map<string, number>;

  public constructor(
    spaces: ISolarSystemSpace[],
    sectorNearStars: string[],
    initialDiscAngles: [number, number, number] = [0, 0, 0],
  ) {
    this.spaces = spaces;
    this.sectorNearStars = [...sectorNearStars];
    this.spaceById = new Map(this.spaces.map((space) => [space.id, space]));
    this.discs = [
      this.buildDisc(0, 1),
      this.buildDisc(1, 2),
      this.buildDisc(2, 3),
    ];
    for (let i = 0; i < 3; i += 1) {
      this.discs[i].currentRotation = normalizeDiscAngle(initialDiscAngles[i]);
    }
    this.adjacency = this.buildAdjacency();
    this.rotationCounter = 0;
    this.probeCounter = 0;
    this.publicityByPlayer = new Map();
  }

  public rotate(discIndex: number): void {
    if (!(discIndex in DISC_TO_MOVING_RINGS)) {
      throw new Error(`Invalid discIndex: ${discIndex}`);
    }

    const movingRingIndexes = DISC_TO_MOVING_RINGS[discIndex];
    const coverStatesByRing = new Map<number, Map<string, IRingCoverState>>();

    for (const movingRingIndex of movingRingIndexes) {
      if (movingRingIndex >= 4) {
        continue;
      }
      const targetRingIndex = movingRingIndex + 1;
      coverStatesByRing.set(
        targetRingIndex,
        this.captureCoverStates(movingRingIndex, targetRingIndex),
      );
    }

    for (const movingRingIndex of movingRingIndexes) {
      this.rotateRingByOneStep(movingRingIndex);
    }

    for (
      let movingDiscIndex = 0;
      movingDiscIndex <= discIndex;
      movingDiscIndex += 1
    ) {
      this.discs[movingDiscIndex].currentRotation =
        (this.discs[movingDiscIndex].currentRotation + 1) %
        ROTATION_STEPS_PER_RING;
    }

    for (const [targetRingIndex, coverStates] of coverStatesByRing.entries()) {
      this.pushCoveredProbes(targetRingIndex, coverStates);
    }

    this.rebuildAdjacencyInPlace();
  }

  public rotateNextDisc(): number {
    const discIndex = this.rotationCounter % this.discs.length;
    this.rotate(discIndex);
    this.rotationCounter += 1;
    return discIndex;
  }

  public getAdjacentSpaces(spaceId: string): ISolarSystemSpace[] {
    const adjacentIds = this.adjacency.get(spaceId) ?? [];
    return adjacentIds
      .map((id) => this.spaceById.get(id))
      .filter((space): space is ISolarSystemSpace => space !== undefined);
  }

  public getSpacesOnPlanet(planet: EPlanet): ISolarSystemSpace[] {
    return this.spaces.filter((space) =>
      space.elements.some(
        (element) =>
          (element.type === ESolarSystemElementType.PLANET ||
            element.type === ESolarSystemElementType.EARTH) &&
          element.planet === planet &&
          element.amount > 0,
      ),
    );
  }

  public getProbesAt(spaceId: string): ISolarProbe[] {
    return [...this.getSpace(spaceId).occupants];
  }

  public placeProbe(playerId: string, spaceId: string): ISolarProbe {
    const targetSpace = this.getSpace(spaceId);
    this.assertTraversable(targetSpace);

    const probe: ISolarProbe = {
      id: `probe-${this.probeCounter}`,
      playerId,
    };
    this.probeCounter += 1;
    targetSpace.occupants.push(probe);
    return probe;
  }

  public moveProbe(
    probeId: string,
    fromId: string,
    toId: string,
  ): IProbeMoveResult {
    const fromSpace = this.getSpace(fromId);
    const toSpace = this.getSpace(toId);
    this.assertTraversable(fromSpace);
    this.assertTraversable(toSpace);

    const adjacentIds = this.adjacency.get(fromId) ?? [];
    if (!adjacentIds.includes(toId)) {
      throw new Error(`Space ${toId} is not adjacent to ${fromId}`);
    }

    const probeIndex = fromSpace.occupants.findIndex(
      (probe) => probe.id === probeId,
    );
    if (probeIndex < 0) {
      throw new Error(`Probe ${probeId} not found in ${fromId}`);
    }

    const [probe] = fromSpace.occupants.splice(probeIndex, 1);
    toSpace.occupants.push(probe);

    const movementCost =
      BASE_MOVE_COST +
      (this.containsElement(fromSpace, ESolarSystemElementType.ASTEROID)
        ? ASTEROID_EXTRA_COST
        : 0);
    const publicityGained = this.grantPublicityOnEnter(probe.playerId, toSpace);

    return {
      probeId: probe.id,
      fromId,
      toId,
      movementCost,
      publicityGained,
    };
  }

  public getPlayerPublicity(playerId: string): number {
    return this.publicityByPlayer.get(playerId) ?? 0;
  }

  private buildDisc(index: number, ringIndex: number): IDisc {
    const spaces = this.spaces
      .filter((space) => space.ringIndex === ringIndex)
      .sort((a, b) => a.indexInRing - b.indexInRing)
      .map((space) => space.id);

    return {
      index,
      currentRotation: 0,
      spaces,
    };
  }

  private buildAdjacency(): Map<string, string[]> {
    const undirectedEdgeSet = new Map<string, Set<string>>();
    for (const space of this.spaces) {
      undirectedEdgeSet.set(space.id, new Set());
    }

    const spacesByRing = this.groupSpacesByRing();
    for (const ringSpaces of spacesByRing.values()) {
      const orderedRingSpaces = [...ringSpaces].sort(
        (left, right) => left.indexInRing - right.indexInRing,
      );
      if (orderedRingSpaces.length === 0) {
        continue;
      }

      for (let index = 0; index < orderedRingSpaces.length; index += 1) {
        const current = orderedRingSpaces[index];
        const next = orderedRingSpaces[(index + 1) % orderedRingSpaces.length];
        this.linkUndirected(undirectedEdgeSet, current.id, next.id);
      }
    }

    for (let ringIndex = 1; ringIndex <= 3; ringIndex += 1) {
      const innerRing = spacesByRing.get(ringIndex);
      const outerRing = spacesByRing.get(ringIndex + 1);
      if (!innerRing || !outerRing) {
        continue;
      }

      const innerCount = innerRing.length;
      const outerCount = outerRing.length;
      for (const innerSpace of innerRing) {
        const innerStart = innerSpace.indexInRing / innerCount;
        const innerEnd = (innerSpace.indexInRing + 1) / innerCount;
        for (const outerSpace of outerRing) {
          const outerStart = outerSpace.indexInRing / outerCount;
          const outerEnd = (outerSpace.indexInRing + 1) / outerCount;
          if (!this.rangesOverlap(innerStart, innerEnd, outerStart, outerEnd)) {
            continue;
          }
          this.linkUndirected(undirectedEdgeSet, innerSpace.id, outerSpace.id);
        }
      }
    }

    const adjacency = new Map<string, string[]>();
    for (const [spaceId, neighbors] of undirectedEdgeSet.entries()) {
      adjacency.set(spaceId, [...neighbors].sort());
    }

    adjacency.set('sun-center', []);
    return adjacency;
  }

  private rebuildAdjacencyInPlace(): void {
    const rebuilt = this.buildAdjacency();
    this.adjacency.clear();
    for (const [spaceId, neighbors] of rebuilt.entries()) {
      this.adjacency.set(spaceId, neighbors);
    }
  }

  private groupSpacesByRing(): Map<number, ISolarSystemSpace[]> {
    const spacesByRing = new Map<number, ISolarSystemSpace[]>();
    for (const space of this.spaces) {
      const group = spacesByRing.get(space.ringIndex) ?? [];
      group.push(space);
      spacesByRing.set(space.ringIndex, group);
    }
    return spacesByRing;
  }

  private rotateRingByOneStep(ringIndex: number): void {
    const ringSpaces = this.spaces
      .filter((space) => space.ringIndex === ringIndex)
      .sort((left, right) => left.indexInRing - right.indexInRing);
    const count = ringSpaces.length;
    if (count === 0) {
      return;
    }

    const elementSnapshots = ringSpaces.map((space) =>
      space.elements.map((element) => ({ ...element })),
    );
    const publicitySnapshots = ringSpaces.map(
      (space) => space.hasPublicityIcon,
    );
    const occupantSnapshots = ringSpaces.map((space) => [...space.occupants]);

    for (let sourceIndex = 0; sourceIndex < count; sourceIndex += 1) {
      const targetIndex = (sourceIndex + 1) % count;
      const targetSpace = ringSpaces[targetIndex];
      targetSpace.elements = elementSnapshots[sourceIndex];
      targetSpace.hasPublicityIcon = publicitySnapshots[sourceIndex];
      targetSpace.occupants = occupantSnapshots[sourceIndex];
    }
  }

  private captureCoverStates(
    upperRingIndex: number,
    lowerRingIndex: number,
  ): Map<string, IRingCoverState> {
    const lowerSpaces = this.spaces
      .filter((space) => space.ringIndex === lowerRingIndex)
      .sort((left, right) => left.indexInRing - right.indexInRing);
    const coverStates = new Map<string, IRingCoverState>();
    for (const lowerSpace of lowerSpaces) {
      const upperSpace = this.resolveUpperSpaceForLower(
        upperRingIndex,
        lowerSpace,
      );
      const isCoveredBefore = !this.containsElement(
        upperSpace,
        ESolarSystemElementType.NULL,
      );
      coverStates.set(lowerSpace.id, {
        before: isCoveredBefore,
        after: false,
      });
    }
    return coverStates;
  }

  private pushCoveredProbes(
    targetRingIndex: number,
    coverStates: Map<string, IRingCoverState>,
  ): void {
    const targetRingSpaces = this.spaces
      .filter((space) => space.ringIndex === targetRingIndex)
      .sort((left, right) => left.indexInRing - right.indexInRing);
    if (targetRingSpaces.length === 0) {
      return;
    }

    const pushes: Array<{
      probe: ISolarProbe;
      fromIndex: number;
      toIndex: number;
    }> = [];
    for (const targetSpace of targetRingSpaces) {
      const coverState = coverStates.get(targetSpace.id);
      if (!coverState) {
        continue;
      }

      const upperSpace = this.resolveUpperSpaceForLower(
        targetRingIndex - 1,
        targetSpace,
      );
      coverState.after = !this.containsElement(
        upperSpace,
        ESolarSystemElementType.NULL,
      );
      if (
        coverState.before ||
        !coverState.after ||
        targetSpace.occupants.length === 0
      ) {
        continue;
      }

      const fromIndex = targetSpace.indexInRing;
      const toIndex = (fromIndex + 1) % targetRingSpaces.length;
      for (const probe of targetSpace.occupants) {
        pushes.push({ probe, fromIndex, toIndex });
      }
      targetSpace.occupants = [];
    }

    for (const push of pushes) {
      const destination = targetRingSpaces[push.toIndex];
      destination.occupants.push(push.probe);
      this.grantPublicityOnEnter(push.probe.playerId, destination);
    }
  }

  private resolveUpperSpaceForLower(
    upperRingIndex: number,
    lowerSpace: ISolarSystemSpace,
  ): ISolarSystemSpace {
    const upperRingSpaces = this.spaces
      .filter((space) => space.ringIndex === upperRingIndex)
      .sort((left, right) => left.indexInRing - right.indexInRing);
    if (upperRingSpaces.length === 0) {
      throw new Error(`Upper ring ${upperRingIndex} has no spaces`);
    }

    const mappedIndex = Math.floor(
      (lowerSpace.indexInRing * upperRingSpaces.length) /
        this.getRingCellCount(lowerSpace.ringIndex),
    );
    return upperRingSpaces[Math.min(mappedIndex, upperRingSpaces.length - 1)];
  }

  private getRingCellCount(ringIndex: number): number {
    const ringOffset = ringIndex - 1;
    return RING_CELL_COUNTS[ringOffset];
  }

  private linkUndirected(
    edgeSet: Map<string, Set<string>>,
    first: string,
    second: string,
  ): void {
    const firstNeighbors = edgeSet.get(first);
    const secondNeighbors = edgeSet.get(second);
    if (!firstNeighbors || !secondNeighbors) {
      return;
    }
    firstNeighbors.add(second);
    secondNeighbors.add(first);
  }

  private rangesOverlap(
    startA: number,
    endA: number,
    startB: number,
    endB: number,
  ): boolean {
    return startA < endB && startB < endA;
  }

  private getSpace(spaceId: string): ISolarSystemSpace {
    const space = this.spaceById.get(spaceId);
    if (!space) {
      throw new Error(`Unknown space id: ${spaceId}`);
    }
    return space;
  }

  private assertTraversable(space: ISolarSystemSpace): void {
    if (
      space.elements.some(
        (element) => element.type === ESolarSystemElementType.SUN,
      )
    ) {
      throw new Error(`Space ${space.id} is not traversable`);
    }
  }

  private containsElement(
    space: ISolarSystemSpace,
    type: ESolarSystemElementType,
  ): boolean {
    return space.elements.some(
      (element) => element.type === type && element.amount > 0,
    );
  }

  private grantPublicityOnEnter(
    playerId: string,
    toSpace: ISolarSystemSpace,
  ): number {
    if (!toSpace.hasPublicityIcon) {
      return 0;
    }

    // Honor an optional numeric amount on the icon; default to +1 for
    // legacy/default-printed icons that don't carry an explicit value.
    const amount = Math.max(1, Math.trunc(toSpace.publicityIconAmount ?? 1));
    const current = this.publicityByPlayer.get(playerId) ?? 0;
    this.publicityByPlayer.set(playerId, current + amount);
    return amount;
  }
}
