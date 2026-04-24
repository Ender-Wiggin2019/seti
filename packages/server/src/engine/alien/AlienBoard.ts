import type { TAlienSlotReward } from '@seti/common/constant/alienBoardConfig';
import type { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
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
//  Trace Slot — the single unified slot entity
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

// ---------------------------------------------------------------------------
//  Alien Board
// ---------------------------------------------------------------------------

export interface IAlienBoardInit {
  alienType: EAlienType;
  alienIndex: number;
  discovered?: boolean;
  slots?: ITraceSlotInit[];
  alienDeckDrawPile?: string[];
  alienDeckDiscardPile?: string[];
  faceUpAlienCardId?: string | null;
}

export class AlienBoard {
  public readonly alienType: EAlienType;

  public readonly alienIndex: number;

  public discovered: boolean;

  public readonly slots: ITraceSlot[];

  public alienDeckDrawPile: string[];

  public alienDeckDiscardPile: string[];

  public faceUpAlienCardId: string | null;

  public constructor(init: IAlienBoardInit) {
    this.alienType = init.alienType;
    this.alienIndex = init.alienIndex;
    this.discovered = init.discovered ?? false;
    this.slots = (init.slots ?? []).map((s) => ({
      slotId: s.slotId,
      alienIndex: s.alienIndex,
      traceColor: s.traceColor,
      occupants: [...(s.occupants ?? [])],
      maxOccupants: s.maxOccupants ?? 1,
      rewards: [...(s.rewards ?? [])],
      isDiscovery: s.isDiscovery ?? false,
    }));

    this.alienDeckDrawPile = [...(init.alienDeckDrawPile ?? [])];
    this.alienDeckDiscardPile = [...(init.alienDeckDiscardPile ?? [])];
    this.faceUpAlienCardId = init.faceUpAlienCardId ?? null;
  }

  // ---- Query helpers -------------------------------------------------------

  public getSlot(slotId: string): ITraceSlot | undefined {
    return this.slots.find((s) => s.slotId === slotId);
  }

  public getDiscoverySlots(): ITraceSlot[] {
    return this.slots.filter((s) => s.isDiscovery);
  }

  /**
   * Returns slots that can accept a trace of the given color.
   * A slot is available when:
   *  1. Its required color matches (or is ANY), AND
   *  2. It has capacity remaining (maxOccupants === -1 means unlimited).
   */
  public getAvailableSlots(traceColor: ETrace): ITraceSlot[] {
    return this.slots.filter((slot) => {
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
    return this.slots.find((s) => s.isDiscovery && s.occupants.length === 0);
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
  public addSlot(init: ITraceSlotInit): ITraceSlot {
    const slot: ITraceSlot = {
      slotId: init.slotId,
      alienIndex: init.alienIndex,
      traceColor: init.traceColor,
      occupants: [...(init.occupants ?? [])],
      maxOccupants: init.maxOccupants ?? 1,
      rewards: [...(init.rewards ?? [])],
      isDiscovery: init.isDiscovery ?? false,
    };
    this.slots.push(slot);
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

  public getPlayerTraceCount(playerId: string): number {
    let count = 0;
    for (const slot of this.slots) {
      for (const occ of slot.occupants) {
        if (occ.source !== 'neutral' && occ.source.playerId === playerId) {
          count += 1;
        }
      }
    }
    return count;
  }

  public getPlayerTraceCountByColor(
    playerId: string,
    traceColor: ETrace,
  ): number {
    let count = 0;
    for (const slot of this.slots) {
      for (const occ of slot.occupants) {
        if (
          occ.source !== 'neutral' &&
          occ.source.playerId === playerId &&
          occ.traceColor === traceColor
        ) {
          count += 1;
        }
      }
    }
    return count;
  }

  // ---- Private helpers -----------------------------------------------------

  private colorMatches(slotColor: ETrace, placedColor: ETrace): boolean {
    const ANY = 'any-trace';
    if (slotColor === ANY || placedColor === ANY) return true;
    return slotColor === placedColor;
  }
}
