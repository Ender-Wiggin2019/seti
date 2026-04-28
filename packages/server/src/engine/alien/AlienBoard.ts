import type { TAlienSlotReward } from '@seti/common/constant/alienBoardConfig';
import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import type { SeededRandom } from '@/shared/rng/SeededRandom.js';

// ---------------------------------------------------------------------------
//  Slot reward types (declarative, executable by AlienState)
// ---------------------------------------------------------------------------

export type TSlotReward = TAlienSlotReward;

// ---------------------------------------------------------------------------
//  Occupant types
// ---------------------------------------------------------------------------

export type TSlotOccupantSource = { playerId: string } | 'neutral';

export interface ITraceOccupant {
  source: TSlotOccupantSource;
  traceColor: ETrace;
}

// ---------------------------------------------------------------------------
//  Trace Slot
// ---------------------------------------------------------------------------

export interface ITraceSlot {
  slotId: string;
  alienIndex: number;
  traceColor: ETrace;
  occupants: ITraceOccupant[];
  maxOccupants: number;
  rewards: TSlotReward[];
  isDiscovery: boolean;
}

export interface ITraceSlotInit {
  slotId: string;
  alienIndex: number;
  traceColor: ETrace;
  occupants?: ITraceOccupant[];
  maxOccupants?: number;
  rewards?: TSlotReward[];
  isDiscovery?: boolean;
}

export type TTracePlayerRef = string | { id: string };

export interface IOumuamuaTileComponent {
  spaceId: string;
  sectorId: string;
  dataRemaining: number;
  markerPlayerIds: string[];
}

// ---------------------------------------------------------------------------
//  Alien Board
// ---------------------------------------------------------------------------

export interface IAlienBoardInit {
  alienType: EAlienType;
  alienIndex: number;
  discovered?: boolean;
  discoverySlots?: ITraceSlotInit[];
  overflowSlots?: ITraceSlotInit[];
  overflowSlot?: ITraceSlotInit;
  speciesTraceSlots?: ITraceSlotInit[];
  slots?: ITraceSlotInit[];
  alienDeckDrawPile?: string[];
  alienDeckDiscardPile?: string[];
  faceUpAlienCardId?: string | null;
}

export interface IAnomaliesAlienBoardInit extends IAlienBoardInit {
  anomalyColumns?: ITraceSlotInit[];
}

export interface IOumuamuaAlienBoardInit extends IAlienBoardInit {
  oumuamuaTile?: IOumuamuaTileComponent | null;
}

export type TAlienBoardInit =
  | IAlienBoardInit
  | IAnomaliesAlienBoardInit
  | IOumuamuaAlienBoardInit;

export class AlienBoard {
  public readonly alienType: EAlienType;

  public readonly alienIndex: number;

  public discovered: boolean;

  public readonly discoverySlots: ITraceSlot[];

  public readonly overflowSlots: ITraceSlot[];

  public readonly speciesTraceSlots: ITraceSlot[];

  public alienDeckDrawPile: string[];

  public alienDeckDiscardPile: string[];

  public faceUpAlienCardId: string | null;

  public constructor(
    init: IAlienBoardInit,
    options: { hydrateSlots?: boolean } = {},
  ) {
    this.alienType = init.alienType;
    this.alienIndex = init.alienIndex;
    this.discovered = init.discovered ?? false;
    this.discoverySlots = [];
    this.overflowSlots = [];
    this.speciesTraceSlots = [];

    if (options.hydrateSlots !== false) {
      this.hydrateTraceSlots(init);
    }

    this.alienDeckDrawPile = [...(init.alienDeckDrawPile ?? [])];
    this.alienDeckDiscardPile = [...(init.alienDeckDiscardPile ?? [])];
    this.faceUpAlienCardId = init.faceUpAlienCardId ?? null;
  }

  public get slots(): ITraceSlot[] {
    return [...this.discoverySlots, ...this.overflowSlots, ...this.traceSlots];
  }

  public get overflowSlot(): ITraceSlot | undefined {
    return this.overflowSlots[0];
  }

  // ---- Query helpers -------------------------------------------------------

  public getSlot(slotId: string): ITraceSlot | undefined {
    return this.slots.find((s) => s.slotId === slotId);
  }

  public getDiscoverySlots(): ITraceSlot[] {
    return this.discoverySlots;
  }

  public getTraceSlots(): ITraceSlot[] {
    return this.slots;
  }

  /**
   * Returns slots that can accept a trace of the given color.
   * A slot is available when:
   *  1. Its required color matches (or is ANY), AND
   *  2. It has capacity remaining (maxOccupants === -1 means unlimited).
   */
  public getAvailableSlots(traceColor: ETrace): ITraceSlot[] {
    return this.getTracePlacementSlots().filter((slot) => {
      if (!this.colorMatches(slot.traceColor, traceColor)) return false;
      if (
        slot.maxOccupants !== -1 &&
        slot.occupants.length >= slot.maxOccupants
      ) {
        return false;
      }
      return true;
    });
  }

  public getFirstEmptyDiscoverySlot(): ITraceSlot | undefined {
    return this.discoverySlots.find((s) => s.occupants.length === 0);
  }

  public initializeAlienDeck(cardIds: readonly string[]): void {
    this.alienDeckDrawPile = [...cardIds];
    this.alienDeckDiscardPile = [];
    this.faceUpAlienCardId = null;
  }

  public drawAlienCardFromDeck(rng?: SeededRandom): string | undefined {
    if (
      this.alienDeckDrawPile.length === 0 &&
      this.alienDeckDiscardPile.length > 0
    ) {
      const recycled = rng
        ? rng.shuffle([...this.alienDeckDiscardPile])
        : [...this.alienDeckDiscardPile];
      this.alienDeckDrawPile.push(...recycled);
      this.alienDeckDiscardPile = [];
    }
    return this.alienDeckDrawPile.shift();
  }

  public revealNextFaceUpAlienCard(rng?: SeededRandom): string | null {
    if (this.faceUpAlienCardId !== null) {
      return this.faceUpAlienCardId;
    }
    const next = this.drawAlienCardFromDeck(rng);
    this.faceUpAlienCardId = next ?? null;
    return this.faceUpAlienCardId;
  }

  public drawFaceUpAlienCard(rng?: SeededRandom): string | undefined {
    if (this.faceUpAlienCardId === null) {
      return undefined;
    }
    const cardId = this.faceUpAlienCardId;
    this.faceUpAlienCardId = null;
    this.revealNextFaceUpAlienCard(rng);
    return cardId;
  }

  public discardAlienCard(cardId: string): void {
    this.alienDeckDiscardPile.push(cardId);
  }

  public isFullyMarked(): boolean {
    return this.getDiscoverySlots().every((s) => s.occupants.length > 0);
  }

  // ---- Mutation ------------------------------------------------------------

  public placeTrace(
    slot: ITraceSlot,
    source: TSlotOccupantSource,
    traceColor: ETrace,
  ): boolean {
    if (
      slot.maxOccupants !== -1 &&
      slot.occupants.length >= slot.maxOccupants
    ) {
      return false;
    }
    slot.occupants.push({ source, traceColor });
    return true;
  }

  /**
   * Adds a new slot to this board (used by alien plugins after discovery).
   */
  public addTraceSlot(init: ITraceSlotInit): ITraceSlot {
    const slot = this.createTraceSlot(init);
    this.pushTraceSlot(slot);
    return slot;
  }

  // ---- Counting ------------------------------------------------------------

  public getDiscoverers(): string[] {
    const playerIds = new Set<string>();
    for (const slot of this.getDiscoverySlots()) {
      for (const occ of slot.occupants) {
        if (occ.source !== 'neutral') {
          playerIds.add(occ.source.playerId);
        }
      }
    }
    return [...playerIds];
  }

  public getPlayerTraceCount(
    player: TTracePlayerRef,
    traceColor: ETrace = ETrace.ANY,
  ): number {
    const playerId = getTracePlayerId(player);
    let count = 0;
    for (const slot of this.getTraceSlots()) {
      for (const occ of slot.occupants) {
        if (
          occ.source !== 'neutral' &&
          occ.source.playerId === playerId &&
          traceColorMatches(occ.traceColor, traceColor)
        ) {
          count += 1;
        }
      }
    }
    return count;
  }

  public getPlayerTraceCountByColor(
    player: TTracePlayerRef,
    traceColor: ETrace,
  ): number {
    return this.getPlayerTraceCount(player, traceColor);
  }

  protected get traceSlots(): ITraceSlot[] {
    return this.speciesTraceSlots;
  }

  // ---- Protected helpers ---------------------------------------------------

  protected hydrateTraceSlots(init: IAlienBoardInit): void {
    for (const slot of init.discoverySlots ?? []) {
      this.discoverySlots.push(this.createTraceSlot(slot));
    }
    if (init.overflowSlot) {
      this.overflowSlots.push(this.createTraceSlot(init.overflowSlot));
    }
    for (const slot of init.overflowSlots ?? []) {
      this.overflowSlots.push(this.createTraceSlot(slot));
    }
    for (const slot of init.speciesTraceSlots ?? []) {
      this.speciesTraceSlots.push(this.createTraceSlot(slot));
    }
    for (const slot of init.slots ?? []) {
      const traceSlot = this.createTraceSlot(slot);
      this.pushTraceSlot(traceSlot);
    }
  }

  protected createTraceSlot(init: ITraceSlotInit): ITraceSlot {
    return {
      slotId: init.slotId,
      alienIndex: init.alienIndex,
      traceColor: init.traceColor,
      occupants: [...(init.occupants ?? [])],
      maxOccupants: init.maxOccupants ?? 1,
      rewards: [...(init.rewards ?? [])],
      isDiscovery: init.isDiscovery ?? false,
    };
  }

  protected getDiscoveredTraceSlots(): ITraceSlot[] {
    return this.speciesTraceSlots;
  }

  protected pushTraceSlot(slot: ITraceSlot): void {
    if (slot.isDiscovery) {
      this.discoverySlots.push(slot);
      return;
    }
    if (this.isOverflowSlot(slot)) {
      this.overflowSlots.push(slot);
      return;
    }
    this.speciesTraceSlots.push(slot);
  }

  // ---- Private helpers -----------------------------------------------------

  private colorMatches(slotColor: ETrace, placedColor: ETrace): boolean {
    const ANY = 'any-trace';
    if (slotColor === ANY || placedColor === ANY) return true;
    return slotColor === placedColor;
  }

  private getTracePlacementSlots(): ITraceSlot[] {
    const baseSlots = [...this.discoverySlots, ...this.overflowSlots];
    if (!this.discovered && baseSlots.length > 0) {
      return baseSlots;
    }
    return [...baseSlots, ...this.getDiscoveredTraceSlots()];
  }

  private isOverflowSlot(slot: ITraceSlot): boolean {
    return slot.slotId.includes('overflow');
  }
}

export class AnomaliesAlienBoard extends AlienBoard {
  public readonly anomalyColumns: ITraceSlot[];

  public constructor(init: IAnomaliesAlienBoardInit) {
    super(init, { hydrateSlots: false });
    this.anomalyColumns = [];

    this.hydrateTraceSlots(init);
    for (const slot of init.anomalyColumns ?? []) {
      this.anomalyColumns.push(this.createTraceSlot(slot));
    }
  }

  public override get slots(): ITraceSlot[] {
    return [...super.slots, ...this.anomalyColumns];
  }

  public addAnomalyColumn(init: ITraceSlotInit): ITraceSlot {
    const slot = this.createTraceSlot(init);
    this.anomalyColumns.push(slot);
    return slot;
  }

  protected override getDiscoveredTraceSlots(): ITraceSlot[] {
    return [...super.getDiscoveredTraceSlots(), ...this.anomalyColumns];
  }
}

export class OumuamuaAlienBoard extends AlienBoard {
  public oumuamuaTile: IOumuamuaTileComponent | null;

  public constructor(init: IOumuamuaAlienBoardInit) {
    super(init, { hydrateSlots: false });
    this.oumuamuaTile = init.oumuamuaTile
      ? {
          ...init.oumuamuaTile,
          markerPlayerIds: [...init.oumuamuaTile.markerPlayerIds],
        }
      : null;
    this.hydrateTraceSlots(init);
  }
}

export function createAlienBoard(init: TAlienBoardInit): AlienBoard {
  if (init.alienType === EAlienType.ANOMALIES) {
    return new AnomaliesAlienBoard(init as IAnomaliesAlienBoardInit);
  }
  if (init.alienType === EAlienType.OUMUAMUA) {
    return new OumuamuaAlienBoard(init as IOumuamuaAlienBoardInit);
  }
  return new AlienBoard(init);
}

export function isAnomaliesAlienBoard(
  board: AlienBoard | null | undefined,
): board is AnomaliesAlienBoard {
  return board instanceof AnomaliesAlienBoard;
}

export function isOumuamuaAlienBoard(
  board: AlienBoard | null | undefined,
): board is OumuamuaAlienBoard {
  return board instanceof OumuamuaAlienBoard;
}

function getTracePlayerId(player: TTracePlayerRef): string {
  return typeof player === 'string' ? player : player.id;
}

function traceColorMatches(placedColor: ETrace, filterColor: ETrace): boolean {
  if (filterColor === ETrace.ANY) return true;
  return placedColor === filterColor;
}
