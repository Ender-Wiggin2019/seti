import {
  ALL_SECTOR_POSITIONS,
  ALL_SECTOR_TILE_IDS,
  createDefaultSolarSystemWheels,
  type ESectorPosition,
  type ESectorTileId,
  type EStarName,
  type ISectorTilePlacement,
  type ISolarSystemSetupConfig,
  normalizeDiscAngle,
  ROTATION_STEPS_PER_RING,
  SECTOR_STAR_CONFIGS,
  SECTOR_TILE_DEFINITIONS,
} from '@seti/common/constant/sectorSetup';
import {
  buildCoordinate,
  type ISolarCoordinate,
  SECTOR_COUNT,
  RING_CELL_COUNTS as SHARED_RING_CELL_COUNTS,
  SOLAR_RING_COUNT,
  sectorIndexOf,
  type TSolarRingIndex,
} from '@seti/common/constant/solarCoordinate';
import { EPlanet } from '@seti/common/types/protocol/enums';
import type { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { Sector } from './Sector.js';
import { SOLAR_SYSTEM_CELL_CONFIGS } from './SolarSystemConfig.js';
import {
  ESolarSystemElementType,
  type IDisc,
  type IProbeMoveResult,
  type ISolarProbe,
  type ISolarSystemElement,
  type ISolarSystemSpace,
} from './SolarSystemTypes.js';

export {
  ESolarSystemElementType,
  type IDisc,
  type IProbeMoveResult,
  type ISolarProbe,
  type ISolarSystemElement,
  type ISolarSystemSpace,
};

export interface IPlanetLocation {
  planet: EPlanet;
  space: ISolarSystemSpace;
  coordinate: ISolarCoordinate;
}

export interface IProbeLocation {
  probe: ISolarProbe;
  space: ISolarSystemSpace;
  coordinate: ISolarCoordinate;
}

export interface ITopSectorElement {
  ringIndex: TSolarRingIndex;
  space: ISolarSystemSpace;
  element: ISolarSystemElement;
}

export interface ISolarSystemInitResult {
  solarSystem: SolarSystem;
  sectors: Sector[];
  setupConfig: ISolarSystemSetupConfig;
}

export interface ISolarSystemInitOptions {
  initialDiscAngles?: [number, number, number];
  tilePlacements?: ISectorTilePlacement[];
}

interface IRingCoverState {
  before: boolean;
  after: boolean;
}

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

  /** Static: which spaces live inside a given sector (0..7). Never changes. */
  private readonly spacesBySector: Map<number, ISolarSystemSpace[]>;

  /** Dynamic: which space currently carries the given planet element. */
  private readonly planetSpaceByPlanet: Map<EPlanet, ISolarSystemSpace>;

  /** Dynamic: fast probe-id → space lookup. */
  private readonly probeLocationById: Map<string, ISolarSystemSpace>;

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
    for (let i = 0; i < 3; i += 1) {
      for (let step = 0; step < this.discs[i].currentRotation; step += 1) {
        this.rotateRingByOneStep(i + 1);
      }
    }
    this.adjacency = this.buildAdjacency();
    this.rotationCounter = 0;
    this.probeCounter = 0;
    this.publicityByPlayer = new Map();

    this.spacesBySector = this.buildSpacesBySector();
    this.planetSpaceByPlanet = new Map();
    this.probeLocationById = new Map();
    this.rebuildElementAndProbeIndexes();
  }

  /**
   * One-call factory that implements the shared setup rule from
   * `docs/arch/prd-rule.md §5.1 #3`:
   *   - shuffle 4 physical sector tiles over 4 board positions (→ 8 sectors)
   *   - randomize 3 rotatable disc angles (ring 1/2/3 independently)
   *   - build SolarSystem, Sector[] (each with its star's data capacity)
   *
   * Callers may override either randomized axis via `opts` for tests.
   */
  public static init(
    random: SeededRandom,
    opts: ISolarSystemInitOptions = {},
  ): ISolarSystemInitResult {
    const tilePlacements =
      opts.tilePlacements ?? this.randomizeTilePlacements(random);
    const initialDiscAngles =
      opts.initialDiscAngles ?? this.randomizeDiscAngles(random);

    const setupConfig = buildSetupConfig(tilePlacements, initialDiscAngles);
    const solarSystem = buildSolarSystemFromConfig(setupConfig);
    const sectors = buildSectorsFromPlacements(tilePlacements);

    return { solarSystem, sectors, setupConfig };
  }

  /** Exposed for tests & serializers that need the randomized half only. */
  public static randomizeTilePlacements(
    random: SeededRandom,
  ): ISectorTilePlacement[] {
    return randomizeTilePlacementsImpl(random);
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
    this.rebuildElementAndProbeIndexes();
  }

  public rotateNextDisc(): number {
    const discIndex = this.rotationCounter % this.discs.length;
    this.rotate(discIndex);
    this.rotationCounter += 1;
    return discIndex;
  }

  // ── Query API ─────────────────────────────────────────────────────────

  public getAdjacentSpaces(spaceId: string): ISolarSystemSpace[] {
    const adjacentIds = this.adjacency.get(spaceId) ?? [];
    return adjacentIds
      .map((id) => this.spaceById.get(id))
      .filter((space): space is ISolarSystemSpace => space !== undefined);
  }

  /**
   * Legacy accessor retained for callers that expect an array (e.g. setup
   * paths that run before a planet is placed). Prefer {@link getPlanetLocation}
   * for new code — it is O(1) after the index is built in the constructor.
   */
  public getSpacesOnPlanet(planet: EPlanet): ISolarSystemSpace[] {
    const space = this.planetSpaceByPlanet.get(planet);
    return space ? [space] : [];
  }

  public getPlanetLocation(planet: EPlanet): IPlanetLocation | null {
    const space = this.planetSpaceByPlanet.get(planet);
    if (!space) return null;
    return {
      planet,
      space,
      coordinate: buildCoordinate(space.ringIndex, space.indexInRing),
    };
  }

  public getSectorIndexOfPlanet(planet: EPlanet): number | null {
    const space = this.planetSpaceByPlanet.get(planet);
    if (!space) return null;
    return sectorIndexOf(space.ringIndex, space.indexInRing);
  }

  public getCoordinate(spaceId: string): ISolarCoordinate | null {
    const space = this.spaceById.get(spaceId);
    if (!space) return null;
    try {
      return buildCoordinate(space.ringIndex, space.indexInRing);
    } catch {
      return null;
    }
  }

  public getSectorIndexOfSpace(spaceId: string): number | null {
    const space = this.spaceById.get(spaceId);
    if (!space) return null;
    return sectorIndexOf(space.ringIndex, space.indexInRing);
  }

  /** Ordered ring-1 → ring-4 cells that belong to a given sector (0..7). */
  public getSpacesInSector(sectorIndex: number): ISolarSystemSpace[] {
    return this.spacesBySector.get(sectorIndex) ?? [];
  }

  /**
   * The topmost *covering* space in a sector — walking ring-1 down to ring-4
   * and stopping at the first space whose element is NOT `NULL`. That cell
   * is the one that would "hide" the ones below it during rotation.
   */
  public getTopSpaceInSector(sectorIndex: number): ISolarSystemSpace | null {
    for (const space of this.getSpacesInSector(sectorIndex)) {
      if (!this.containsElement(space, ESolarSystemElementType.NULL)) {
        return space;
      }
    }
    return null;
  }

  public getTopElementInSector(sectorIndex: number): ITopSectorElement | null {
    const space = this.getTopSpaceInSector(sectorIndex);
    if (!space) return null;
    const element = space.elements.find(
      (el) => el.type !== ESolarSystemElementType.NULL && el.amount > 0,
    );
    if (!element) return null;
    return {
      ringIndex: space.ringIndex as TSolarRingIndex,
      space,
      element,
    };
  }

  public getProbesInSector(
    sectorIndex: number,
    filter?: { playerId?: string },
  ): IProbeLocation[] {
    const result: IProbeLocation[] = [];
    for (const space of this.getSpacesInSector(sectorIndex)) {
      for (const probe of space.occupants) {
        if (filter?.playerId && probe.playerId !== filter.playerId) {
          continue;
        }
        result.push({
          probe,
          space,
          coordinate: buildCoordinate(space.ringIndex, space.indexInRing),
        });
      }
    }
    return result;
  }

  public findProbe(probeId: string): IProbeLocation | null {
    const space = this.probeLocationById.get(probeId);
    if (!space) return null;
    const probe = space.occupants.find((p) => p.id === probeId);
    if (!probe) return null;
    return {
      probe,
      space,
      coordinate: buildCoordinate(space.ringIndex, space.indexInRing),
    };
  }

  public getProbesAt(spaceId: string): ISolarProbe[] {
    return [...this.getSpace(spaceId).occupants];
  }

  /**
   * Place or move a dynamic planet marker (e.g. Oumuamua) onto a specific
   * space on the solar-system board.
   */
  public setDynamicPlanetAtSpace(
    planet: EPlanet,
    spaceId: string,
    options?: { grantVisitPublicity?: boolean },
  ): void {
    const targetSpace = this.getSpace(spaceId);
    const planetElementType =
      planet === EPlanet.EARTH
        ? ESolarSystemElementType.EARTH
        : ESolarSystemElementType.PLANET;

    for (const space of this.spaces) {
      space.elements = space.elements.filter(
        (element) => !(element.planet === planet && element.amount > 0),
      );
    }

    targetSpace.elements.push({
      type: planetElementType,
      amount: 1,
      planet,
    });
    if (options?.grantVisitPublicity) {
      targetSpace.hasPublicityIcon = true;
      if (
        !targetSpace.publicityIconAmount ||
        targetSpace.publicityIconAmount < 1
      ) {
        targetSpace.publicityIconAmount = 1;
      }
    }

    this.rebuildElementAndProbeIndexes();
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
    this.probeLocationById.set(probe.id, targetSpace);
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
    this.probeLocationById.set(probe.id, toSpace);

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

  /**
   * Remove one probe belonging to `playerId` currently sitting on the space
   * that carries `planet`. Returns the removed probe (or null when no such
   * probe exists). Replaces the old ad-hoc `ProbeEffectUtils.consumeProbeFromPlanet`
   * splice so the probe-location index stays consistent.
   */
  public consumeProbeByPlanet(
    playerId: string,
    planet: EPlanet,
  ): ISolarProbe | null {
    const space = this.planetSpaceByPlanet.get(planet);
    if (!space) return null;

    const probeIndex = space.occupants.findIndex(
      (probe) => probe.playerId === playerId,
    );
    if (probeIndex < 0) return null;

    const [probe] = space.occupants.splice(probeIndex, 1);
    this.probeLocationById.delete(probe.id);
    return probe;
  }

  public getPlayerPublicity(playerId: string): number {
    return this.publicityByPlayer.get(playerId) ?? 0;
  }

  // ── Internal setup helpers ────────────────────────────────────────────

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

  private buildSpacesBySector(): Map<number, ISolarSystemSpace[]> {
    const bySector = new Map<number, ISolarSystemSpace[]>();
    for (let s = 0; s < SECTOR_COUNT; s += 1) {
      bySector.set(s, []);
    }

    for (const space of this.spaces) {
      if (space.ringIndex < 1 || space.ringIndex > SOLAR_RING_COUNT) {
        continue;
      }
      const sector = sectorIndexOf(space.ringIndex, space.indexInRing);
      bySector.get(sector)?.push(space);
    }

    for (const list of bySector.values()) {
      list.sort((a, b) => {
        if (a.ringIndex !== b.ringIndex) return a.ringIndex - b.ringIndex;
        return a.indexInRing - b.indexInRing;
      });
    }
    return bySector;
  }

  /**
   * Rebuild the dynamic indexes from the current `spaces` array. Called on
   * construction and after every rotation. O(N) where N is the total
   * number of cells (~80). The hit is negligible compared to adjacency
   * rebuild which already runs on each rotation.
   */
  private rebuildElementAndProbeIndexes(): void {
    this.planetSpaceByPlanet.clear();
    this.probeLocationById.clear();
    for (const space of this.spaces) {
      for (const element of space.elements) {
        if (
          (element.type === ESolarSystemElementType.PLANET ||
            element.type === ESolarSystemElementType.EARTH) &&
          element.planet !== undefined &&
          element.amount > 0
        ) {
          this.planetSpaceByPlanet.set(element.planet, space);
        }
      }
      for (const probe of space.occupants) {
        this.probeLocationById.set(probe.id, space);
      }
    }
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
    const cellsPerVisualStep = Math.max(1, ringIndex);

    for (let sourceIndex = 0; sourceIndex < count; sourceIndex += 1) {
      // Counterclockwise rotation: one wheel step is 45deg. Expanded rings have
      // `ringIndex` cells per visual sector, so preserve each cell's offset
      // inside the sector while moving the whole wheel one visible slot.
      const targetIndex = (sourceIndex + count - cellsPerVisualStep) % count;
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
      const toIndex =
        (fromIndex + targetRingSpaces.length - 1) % targetRingSpaces.length;
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
    return SHARED_RING_CELL_COUNTS[ringOffset];
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

// ── Factory helpers ─────────────────────────────────────────────────────

function buildSetupConfig(
  tilePlacements: ISectorTilePlacement[],
  initialDiscAngles: [number, number, number],
): ISolarSystemSetupConfig {
  return {
    tilePlacements,
    initialDiscAngles,
    wheels: createDefaultSolarSystemWheels(),
  };
}

function buildSolarSystemFromConfig(
  setupConfig: ISolarSystemSetupConfig,
): SolarSystem {
  const nearStars = setupConfig.tilePlacements.flatMap((placement) => {
    const tileDef = SECTOR_TILE_DEFINITIONS[placement.tileId];
    return tileDef.sectors.map((s) => s.starName);
  });

  const spaces: ISolarSystemSpace[] = SOLAR_SYSTEM_CELL_CONFIGS.map((cell) => ({
    id: cell.id,
    ringIndex: cell.ringIndex,
    indexInRing: cell.indexInRing,
    discIndex: cell.discIndex,
    hasPublicityIcon: cell.hasPublicityIcon,
    publicityIconAmount: cell.publicityIconAmount,
    elements: cell.elements.map((element) => ({ ...element })),
    occupants: [],
  }));

  return new SolarSystem(spaces, [...nearStars], setupConfig.initialDiscAngles);
}

function buildSectorsFromPlacements(
  tilePlacements: ISectorTilePlacement[],
): Sector[] {
  const sectors: Sector[] = [];
  for (const placement of tilePlacements) {
    const tileDef = SECTOR_TILE_DEFINITIONS[placement.tileId];
    for (let idx = 0; idx < tileDef.sectors.length; idx += 1) {
      const sectorOnTile = tileDef.sectors[idx];
      const starConfig =
        SECTOR_STAR_CONFIGS[sectorOnTile.starName as EStarName];
      sectors.push(
        new Sector({
          id: placement.sectorIds[idx],
          color: sectorOnTile.color,
          dataSlotCapacity: starConfig?.dataSlotCapacity,
          firstWinBonus: starConfig?.firstWinBonus,
          repeatWinBonus: starConfig?.repeatWinBonus,
        }),
      );
    }
  }
  return sectors;
}

function randomizeTilePlacementsImpl(
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
