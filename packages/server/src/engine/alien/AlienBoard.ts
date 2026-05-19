import type { TAlienSlotReward } from '@seti/common/constant/alienBoardConfig';
import {
  CENTAURIANS_REWARD_SLOT_DEFS,
  type ICentauriansRewardSlotDef,
} from '@seti/common/constant/centaurians';
import {
  createEmptyMascamitesSamplePools,
  type TMascamitesSamplePools,
  type TMascamitesSampleSourcePlanet,
  type TMascamitesSampleTokenId,
} from '@seti/common/constant/mascamites';
import {
  AMOEBA_TRACE_SLOTS,
  createDefaultAmoebaOrganelles,
  createDefaultGlyphidsTokenBank,
  createDefaultGlyphidsTranslationRows,
  GLYPHIDS_BOARD_TOKEN_POSITIONS,
  type IAmoebaOrganelleToken,
  type IArkhosAccessState,
  type IArkhosExplorationRewardRecord,
  type IArkhosSecurityCardState,
  type IGlyphidsBoardToken,
  type IGlyphidsTranslationPlacement,
  type IGlyphidsTranslationRow,
  type TGlyphidsGlyph,
  type TGlyphidsRowsByPlayer,
} from '@seti/common/constant/spaceAgencyAliens';
import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import type { SeededRandom } from '@/shared/rng/SeededRandom.js';
import {
  getTranslatedGlyph,
  placeGlyphOnTranslationTable,
} from './glyphids/GlyphidsTranslationRules.js';

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

export interface IMascamitesCapsuleComponent {
  capsuleId: string;
  ownerId: string;
  sampleTokenId: TMascamitesSampleTokenId;
  sourcePlanet: TMascamitesSampleSourcePlanet;
  spaceId: string;
  missionCardId?: string;
}

export interface IMascamitesDeliveredSampleComponent {
  sampleTokenId: TMascamitesSampleTokenId;
  deliveredBy: string;
  deliveredAtRound: number;
  slotId: string;
}

export type TExertianFaceDownSource =
  | 'discovery'
  | 'milestone-20'
  | 'milestone-40';

export interface IExertianFaceDownCardComponent {
  ownerId: string;
  cardId: string;
  source: TExertianFaceDownSource;
  revealed: boolean;
}

export interface IExertiansMilestoneComponent {
  threshold: number;
  claimedByPlayerIds: string[];
  creditCost: number;
}

export interface ICentauriansMessageMilestoneComponent {
  playerId: string;
  threshold: number;
  sourceCardId: string | null;
  resolved: boolean;
}

export interface ICentauriansRewardSlotComponent
  extends ICentauriansRewardSlotDef {
  claimedByPlayerId: string | null;
}

// ---------------------------------------------------------------------------
//  Alien Board
// ---------------------------------------------------------------------------

export interface IAlienBoardInit {
  alienType: EAlienType;
  alienIndex: number;
  discovered?: boolean;
  discoverySlots?: ITraceSlotInit[];
  /**
   * Overflow trace slots. The earlier shape also accepted a singular
   * `overflowSlot?` alongside this array; if a fixture or migration
   * accidentally set BOTH, `hydrateTraceSlots` happily appended the
   * single one *and* the array, doubling capacity. Singular field
   * removed — callers now use `overflowSlots: [slot]`. The read-only
   * `get overflowSlot()` accessor stays for ergonomic call-sites that
   * just want the first overflow slot.
   */
  overflowSlots?: ITraceSlotInit[];
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

export interface IMascamitesAlienBoardInit extends IAlienBoardInit {
  mascamitesSamplePools?: TMascamitesSamplePools;
  mascamitesPublicSamples?: TMascamitesSampleTokenId[];
  mascamitesCapsules?: IMascamitesCapsuleComponent[];
  mascamitesDeliveredSamples?: IMascamitesDeliveredSampleComponent[];
}

export interface IExertiansAlienBoardInit extends IAlienBoardInit {
  exertiansFaceDownCards?: IExertianFaceDownCardComponent[];
  exertiansMilestones?: IExertiansMilestoneComponent[];
}

export interface ICentauriansAlienBoardInit extends IAlienBoardInit {
  centauriansMessageMilestones?: ICentauriansMessageMilestoneComponent[];
  centauriansPendingMessagesByPlayer?: Record<string, string[]>;
  centauriansRewardSlots?: ICentauriansRewardSlotComponent[];
}

export interface IGlyphidsAlienBoardInit extends IAlienBoardInit {
  glyphidsGlyphTokenBank?: TGlyphidsGlyph[];
  glyphidsGlyphRows?: TGlyphidsRowsByPlayer;
  glyphidsBoardTokens?: IGlyphidsBoardToken[];
  glyphidsTranslationRows?: IGlyphidsTranslationRow[];
}

export interface IAmoebaAlienBoardInit extends IAlienBoardInit {
  amoebaOrganelles?: IAmoebaOrganelleToken[];
}

export interface IArkhosAlienBoardInit extends IAlienBoardInit {
  arkhosExplorationDrawPile?: string[];
  arkhosExplorationReservePile?: string[];
  arkhosExplorationDiscardPile?: string[];
  arkhosSecurityCardsByPlayer?: Record<string, IArkhosSecurityCardState[]>;
  arkhosAccessByPlayer?: Record<string, IArkhosAccessState>;
  arkhosResolvedExplorationRewards?: IArkhosExplorationRewardRecord[];
}

export type TAlienBoardInit =
  | IAlienBoardInit
  | IAnomaliesAlienBoardInit
  | IOumuamuaAlienBoardInit
  | IMascamitesAlienBoardInit
  | IExertiansAlienBoardInit
  | ICentauriansAlienBoardInit
  | IGlyphidsAlienBoardInit
  | IAmoebaAlienBoardInit
  | IArkhosAlienBoardInit;

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

export class MascamitesAlienBoard extends AlienBoard {
  public samplePools: TMascamitesSamplePools;

  public publicSamples: TMascamitesSampleTokenId[];

  public capsules: IMascamitesCapsuleComponent[];

  public deliveredSamples: IMascamitesDeliveredSampleComponent[];

  private capsuleCounter: number;

  public constructor(init: IMascamitesAlienBoardInit) {
    super(init);
    this.samplePools = cloneMascamitesSamplePools(init.mascamitesSamplePools);
    this.publicSamples = [...(init.mascamitesPublicSamples ?? [])];
    this.capsules = (init.mascamitesCapsules ?? []).map((capsule) => ({
      ...capsule,
    }));
    this.deliveredSamples = (init.mascamitesDeliveredSamples ?? []).map(
      (sample) => ({ ...sample }),
    );
    this.capsuleCounter = this.resolveNextCapsuleCounter();
  }

  public createCapsule(
    init: Omit<IMascamitesCapsuleComponent, 'capsuleId'> & {
      capsuleId?: string;
    },
  ): IMascamitesCapsuleComponent {
    const capsule: IMascamitesCapsuleComponent = {
      capsuleId: init.capsuleId ?? this.nextCapsuleId(),
      ownerId: init.ownerId,
      sampleTokenId: init.sampleTokenId,
      sourcePlanet: init.sourcePlanet,
      spaceId: init.spaceId,
      missionCardId: init.missionCardId,
    };
    this.capsules.push(capsule);
    return capsule;
  }

  public getCapsule(
    capsuleId: string,
  ): IMascamitesCapsuleComponent | undefined {
    return this.capsules.find((capsule) => capsule.capsuleId === capsuleId);
  }

  public removeCapsule(
    capsuleId: string,
  ): IMascamitesCapsuleComponent | undefined {
    const index = this.capsules.findIndex(
      (capsule) => capsule.capsuleId === capsuleId,
    );
    if (index < 0) return undefined;
    return this.capsules.splice(index, 1)[0];
  }

  private nextCapsuleId(): string {
    const id = `mascamites-capsule-${this.capsuleCounter}`;
    this.capsuleCounter += 1;
    return id;
  }

  private resolveNextCapsuleCounter(): number {
    let next = 0;
    for (const capsule of this.capsules) {
      const suffix = Number(capsule.capsuleId.split('-').at(-1));
      if (Number.isInteger(suffix) && suffix >= next) {
        next = suffix + 1;
      }
    }
    return next;
  }
}

export class ExertiansAlienBoard extends AlienBoard {
  public faceDownCards: IExertianFaceDownCardComponent[];

  public milestones: IExertiansMilestoneComponent[];

  public constructor(init: IExertiansAlienBoardInit) {
    super(init);
    this.faceDownCards = (init.exertiansFaceDownCards ?? []).map((card) => ({
      ...card,
    }));
    this.milestones = (init.exertiansMilestones ?? []).map((milestone) => ({
      ...milestone,
      claimedByPlayerIds: [...milestone.claimedByPlayerIds],
    }));
  }

  public playFaceDownCard(
    ownerId: string,
    cardId: string,
    source: TExertianFaceDownSource,
  ): IExertianFaceDownCardComponent {
    const played: IExertianFaceDownCardComponent = {
      ownerId,
      cardId,
      source,
      revealed: false,
    };
    this.faceDownCards.push(played);
    return played;
  }
}

export class CentauriansAlienBoard extends AlienBoard {
  public messageMilestones: ICentauriansMessageMilestoneComponent[];

  public pendingMessagesByPlayer: Record<string, string[]>;

  public rewardSlots: ICentauriansRewardSlotComponent[];

  public constructor(init: ICentauriansAlienBoardInit) {
    super(init);
    this.messageMilestones = (init.centauriansMessageMilestones ?? []).map(
      (milestone) => ({
        ...milestone,
      }),
    );
    this.pendingMessagesByPlayer = Object.fromEntries(
      Object.entries(init.centauriansPendingMessagesByPlayer ?? {}).map(
        ([playerId, cardIds]) => [playerId, [...cardIds]],
      ),
    );
    this.rewardSlots = (
      init.centauriansRewardSlots ?? createDefaultCentauriansRewardSlots()
    ).map((slot) => ({
      ...slot,
      rewards: slot.rewards.map((reward) => ({ ...reward })),
    }));
  }

  public sendMessage(
    playerId: string,
    cardId: string,
    currentScore: number,
  ): ICentauriansMessageMilestoneComponent {
    this.pendingMessagesByPlayer[playerId] ??= [];
    this.pendingMessagesByPlayer[playerId].push(cardId);
    const milestone: ICentauriansMessageMilestoneComponent = {
      playerId,
      threshold: currentScore + 15,
      sourceCardId: cardId,
      resolved: false,
    };
    this.messageMilestones.push(milestone);
    return milestone;
  }

  public getAvailableRewardSlots(): ICentauriansRewardSlotComponent[] {
    return this.rewardSlots.filter(
      (slot) => slot.repeatable === true || slot.claimedByPlayerId === null,
    );
  }

  public claimRewardSlot(
    slotId: string,
    playerId: string,
  ): ICentauriansRewardSlotComponent | undefined {
    const slot = this.rewardSlots.find(
      (candidate) => candidate.slotId === slotId,
    );
    if (!slot) {
      return undefined;
    }
    if (slot.claimedByPlayerId !== null && slot.repeatable !== true) {
      return undefined;
    }
    slot.claimedByPlayerId = playerId;
    return slot;
  }
}

export class GlyphidsAlienBoard extends AlienBoard {
  public glyphTokenBank: TGlyphidsGlyph[];

  public glyphRows: TGlyphidsRowsByPlayer;

  public boardTokens: IGlyphidsBoardToken[];

  public translationRows: IGlyphidsTranslationRow[];

  public constructor(init: IGlyphidsAlienBoardInit) {
    super(init);
    this.glyphTokenBank = [
      ...(init.glyphidsGlyphTokenBank ?? createDefaultGlyphidsTokenBank()),
    ];
    this.glyphRows = cloneGlyphRows(init.glyphidsGlyphRows ?? {});
    this.boardTokens = cloneGlyphidsBoardTokens(init.glyphidsBoardTokens ?? []);
    this.translationRows = cloneGlyphidsTranslationRows(
      init.glyphidsTranslationRows,
    );
  }

  public dealBoardTokensFromBank(): void {
    this.boardTokens = GLYPHIDS_BOARD_TOKEN_POSITIONS.map((position) => {
      const glyph = this.glyphTokenBank.shift();
      if (glyph === undefined) {
        throw new Error('Glyphids token bank has too few tokens for setup');
      }
      return { position, glyph };
    });
  }

  public resetTranslationRows(sides: readonly [1 | 2, 1 | 2]): void {
    this.translationRows = createDefaultGlyphidsTranslationRows(sides);
  }

  public getTranslatedGlyph(
    glyph: TGlyphidsGlyph,
  ): IGlyphidsTranslationPlacement | undefined {
    return getTranslatedGlyph(this.translationRows, glyph);
  }

  public placeGlyphOnTranslationTable(
    level: 1 | 2,
    position: number,
    glyph: TGlyphidsGlyph,
  ): boolean {
    return placeGlyphOnTranslationTable(
      this.translationRows,
      level,
      position,
      glyph,
    );
  }

  public collectGlyphToken(playerId: string, glyph: TGlyphidsGlyph): number {
    const rows = (this.glyphRows[playerId] ??= []);
    for (let rowIndex = 0; rowIndex < 5; rowIndex += 1) {
      const row = (rows[rowIndex] ??= []);
      if (!row.includes(glyph)) {
        row.push(glyph);
        return rowIndex;
      }
    }
    return -1;
  }

  public claimBoardToken(
    playerId: string,
    position: number,
    options: { rivalDirection?: 'left' | 'right' } = {},
  ): TGlyphidsGlyph | undefined {
    const tokenIndex = this.boardTokens.findIndex((token) => {
      return token.position === position;
    });
    if (tokenIndex < 0) {
      return undefined;
    }

    const [token] = this.boardTokens.splice(tokenIndex, 1);
    if (!token) {
      return undefined;
    }

    if (options.rivalDirection) {
      this.gainRivalGlyphToken(playerId, token.glyph, options.rivalDirection);
    } else {
      this.collectGlyphToken(playerId, token.glyph);
    }
    return token.glyph;
  }

  public gainRivalGlyphToken(
    playerId: string,
    glyph: TGlyphidsGlyph,
    direction: 'left' | 'right',
  ): 'translated' | 'collected' {
    if (this.placeRivalGlyphOnTranslationTable(glyph, direction)) {
      return 'translated';
    }
    this.collectGlyphToken(playerId, glyph);
    return 'collected';
  }

  public placeRivalGlyphOnTranslationTable(
    glyph: TGlyphidsGlyph,
    direction: 'left' | 'right',
  ): boolean {
    const positions = direction === 'right' ? [3, 2, 1, 0] : [0, 1, 2, 3];

    for (const level of [2, 1] as const) {
      for (const position of positions) {
        if (this.placeGlyphOnTranslationTable(level, position, glyph)) {
          return true;
        }
      }
    }
    return false;
  }

}

export class AmoebaAlienBoard extends AlienBoard {
  public organelles: IAmoebaOrganelleToken[];

  public constructor(init: IAmoebaAlienBoardInit) {
    super(init);
    this.organelles = (
      init.amoebaOrganelles ?? createDefaultAmoebaOrganelles()
    ).map((token) => ({ ...token }));
  }

  public getOrganellesInSection(traceColor: ETrace): IAmoebaOrganelleToken[] {
    return this.organelles
      .filter((organelle) => {
        return (
          this.traceColorForOrganellePosition(organelle.position) === traceColor
        );
      })
      .sort((left, right) => right.position - left.position);
  }

  public countOrganellesInSection(traceColor: ETrace): number {
    return this.getOrganellesInSection(traceColor).length;
  }

  public traceColorForOrganellePosition(position: number): ETrace | undefined {
    return AMOEBA_TRACE_SLOTS.find((slot) => slot.position === position)
      ?.traceColor;
  }

  public moveOrganelleToken(tokenId: string): boolean {
    const organelle = this.organelles.find(
      (token) => token.tokenId === tokenId,
    );
    if (!organelle) {
      return false;
    }

    organelle.position = this.nextAvailableOrganellePosition(
      organelle.position,
    );
    return true;
  }

  public moveOrganellesInSection(traceColor: ETrace): void {
    for (const organelle of this.getOrganellesInSection(traceColor)) {
      this.moveOrganelleToken(organelle.tokenId);
    }
  }

  public getRemovableMarkerSlots(playerId: string): ITraceSlot[] {
    return [
      ...this.speciesTraceSlots,
      ...this.discoverySlots,
      ...this.overflowSlots,
    ].filter((slot) =>
      slot.occupants.some((occupant) => {
        return (
          occupant.source !== 'neutral' && occupant.source.playerId === playerId
        );
      }),
    );
  }

  public removePlayerMarkerFromSlot(
    slotId: string,
    playerId: string,
  ): ETrace | undefined {
    const slot = this.getRemovableMarkerSlots(playerId).find(
      (candidate) => candidate.slotId === slotId,
    );
    if (!slot) {
      return undefined;
    }

    const occupantIndex = slot.occupants.findIndex((occupant) => {
      return (
        occupant.source !== 'neutral' && occupant.source.playerId === playerId
      );
    });
    if (occupantIndex < 0) {
      return undefined;
    }

    slot.occupants.splice(occupantIndex, 1);
    return slot.traceColor;
  }

  private nextAvailableOrganellePosition(currentPosition: number): number {
    const occupiedPositions = new Set(
      this.organelles.map((organelle) => organelle.position),
    );
    occupiedPositions.delete(currentPosition);

    let nextPosition = this.nextOrganellePosition(currentPosition);
    while (occupiedPositions.has(nextPosition)) {
      nextPosition = this.nextOrganellePosition(nextPosition);
    }
    return nextPosition;
  }

  private nextOrganellePosition(position: number): number {
    if (position < 6) {
      return (position + 1) % 6;
    }
    return 6 + ((position + 1) % 3);
  }
}

export class ArkhosAlienBoard extends AlienBoard {
  public explorationDrawPile: string[];

  public explorationReservePile: string[];

  public explorationDiscardPile: string[];

  public securityCardsByPlayer: Record<string, IArkhosSecurityCardState[]>;

  public accessByPlayer: Record<string, IArkhosAccessState>;

  public resolvedExplorationRewards: IArkhosExplorationRewardRecord[];

  public constructor(init: IArkhosAlienBoardInit) {
    super(init);
    this.explorationDrawPile = [...(init.arkhosExplorationDrawPile ?? [])];
    this.explorationReservePile = [
      ...(init.arkhosExplorationReservePile ?? []),
    ];
    this.explorationDiscardPile = [
      ...(init.arkhosExplorationDiscardPile ?? []),
    ];
    this.securityCardsByPlayer = cloneArkhosSecurityCardsByPlayer(
      init.arkhosSecurityCardsByPlayer ?? {},
    );
    this.accessByPlayer = cloneArkhosAccessByPlayer(
      init.arkhosAccessByPlayer ?? {},
    );
    this.resolvedExplorationRewards = (
      init.arkhosResolvedExplorationRewards ?? []
    ).map((reward) => ({ ...reward }));
  }

  public initializeExplorationCards(cardIds: readonly string[]): void {
    this.explorationDrawPile = cardIds.slice(0, 5);
    this.explorationReservePile = cardIds.slice(5);
    this.explorationDiscardPile = [];
  }

  public revealExplorationCard(rng?: SeededRandom): string | undefined {
    if (
      this.explorationDrawPile.length === 0 &&
      (this.explorationDiscardPile.length > 0 ||
        this.explorationReservePile.length > 0)
    ) {
      this.initializeExplorationCards(
        rng
          ? rng.shuffle([
              ...this.explorationDiscardPile,
              ...this.explorationReservePile,
            ])
          : [...this.explorationDiscardPile, ...this.explorationReservePile],
      );
    }
    const cardId = this.explorationDrawPile.shift();
    if (cardId) {
      this.explorationDiscardPile.push(cardId);
    }
    return cardId;
  }

  public ensurePlayerAccess(playerId: string): IArkhosAccessState {
    this.accessByPlayer[playerId] ??= {
      breachedCount: 0,
      accessLevel: 0,
    };
    return this.accessByPlayer[playerId];
  }

  public setPlayerSecurityCards(
    playerId: string,
    cards: readonly IArkhosSecurityCardState[],
  ): void {
    this.securityCardsByPlayer[playerId] = cards.map((card) => ({ ...card }));
    this.ensurePlayerAccess(playerId);
  }
}

function createDefaultCentauriansRewardSlots(): ICentauriansRewardSlotComponent[] {
  return CENTAURIANS_REWARD_SLOT_DEFS.map((slot) => ({
    ...slot,
    rewards: slot.rewards.map((reward) => ({ ...reward })),
    claimedByPlayerId: null,
  }));
}

export function createAlienBoard(init: TAlienBoardInit): AlienBoard {
  if (init.alienType === EAlienType.CENTAURIANS) {
    return new CentauriansAlienBoard(init as ICentauriansAlienBoardInit);
  }
  if (init.alienType === EAlienType.ANOMALIES) {
    return new AnomaliesAlienBoard(init as IAnomaliesAlienBoardInit);
  }
  if (init.alienType === EAlienType.OUMUAMUA) {
    return new OumuamuaAlienBoard(init as IOumuamuaAlienBoardInit);
  }
  if (init.alienType === EAlienType.MASCAMITES) {
    return new MascamitesAlienBoard(init as IMascamitesAlienBoardInit);
  }
  if (init.alienType === EAlienType.EXERTIANS) {
    return new ExertiansAlienBoard(init as IExertiansAlienBoardInit);
  }
  if (init.alienType === EAlienType.GLYPHIDS) {
    return new GlyphidsAlienBoard(init as IGlyphidsAlienBoardInit);
  }
  if (init.alienType === EAlienType.AMOEBA) {
    return new AmoebaAlienBoard(init as IAmoebaAlienBoardInit);
  }
  if (init.alienType === EAlienType.ARKHOS) {
    return new ArkhosAlienBoard(init as IArkhosAlienBoardInit);
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

export function isMascamitesAlienBoard(
  board: AlienBoard | null | undefined,
): board is MascamitesAlienBoard {
  return board instanceof MascamitesAlienBoard;
}

export function isExertiansAlienBoard(
  board: AlienBoard | null | undefined,
): board is ExertiansAlienBoard {
  return board instanceof ExertiansAlienBoard;
}

export function isCentauriansAlienBoard(
  board: AlienBoard | null | undefined,
): board is CentauriansAlienBoard {
  return board instanceof CentauriansAlienBoard;
}

export function isGlyphidsAlienBoard(
  board: AlienBoard | null | undefined,
): board is GlyphidsAlienBoard {
  return board instanceof GlyphidsAlienBoard;
}

export function isAmoebaAlienBoard(
  board: AlienBoard | null | undefined,
): board is AmoebaAlienBoard {
  return board instanceof AmoebaAlienBoard;
}

export function isArkhosAlienBoard(
  board: AlienBoard | null | undefined,
): board is ArkhosAlienBoard {
  return board instanceof ArkhosAlienBoard;
}

function cloneMascamitesSamplePools(
  pools: TMascamitesSamplePools | undefined,
): TMascamitesSamplePools {
  const base = createEmptyMascamitesSamplePools();
  if (!pools) return base;
  return {
    jupiter: [...pools.jupiter],
    saturn: [...pools.saturn],
  };
}

function getTracePlayerId(player: TTracePlayerRef): string {
  return typeof player === 'string' ? player : player.id;
}

function cloneGlyphRows(rows: TGlyphidsRowsByPlayer): TGlyphidsRowsByPlayer {
  return Object.fromEntries(
    Object.entries(rows).map(([playerId, glyphRows]) => [
      playerId,
      glyphRows.map((row) => [...row]),
    ]),
  );
}

function cloneGlyphidsBoardTokens(
  tokens: readonly IGlyphidsBoardToken[],
): IGlyphidsBoardToken[] {
  return tokens.map((token) => ({ ...token }));
}

function cloneGlyphidsTranslationRows(
  rows: IGlyphidsTranslationRow[] | undefined,
): IGlyphidsTranslationRow[] {
  if (!rows) return createDefaultGlyphidsTranslationRows();

  return rows.map((row, index) => {
    const rawRow = row as Partial<IGlyphidsTranslationRow>;
    const rawLevel = rawRow.level;
    const level = rawLevel ?? ((index === 0 ? 1 : 2) as 1 | 2);
    const side = rawRow.side === 2 ? 2 : 1;
    if (rawLevel !== 1 && rawLevel !== 2) {
      const fallbackRows = createDefaultGlyphidsTranslationRows([
        level === 1 ? side : 1,
        level === 2 ? side : 1,
      ]);
      return (
        fallbackRows[level - 1] ?? createDefaultGlyphidsTranslationRows()[0]
      );
    }
    const slotCount = level === 2 ? 3 : 4;
    const glyphs = Array.from({ length: slotCount }, (_, index) => {
      return row.glyphs[index] ?? null;
    });
    return {
      ...row,
      level,
      glyphs,
    };
  });
}

function cloneArkhosSecurityCardsByPlayer(
  cardsByPlayer: Record<string, IArkhosSecurityCardState[]>,
): Record<string, IArkhosSecurityCardState[]> {
  return Object.fromEntries(
    Object.entries(cardsByPlayer).map(([playerId, cards]) => [
      playerId,
      cards.map((card) => ({ ...card })),
    ]),
  );
}

function cloneArkhosAccessByPlayer(
  accessByPlayer: Record<string, IArkhosAccessState>,
): Record<string, IArkhosAccessState> {
  return Object.fromEntries(
    Object.entries(accessByPlayer).map(([playerId, access]) => [
      playerId,
      { ...access },
    ]),
  );
}

function traceColorMatches(placedColor: ETrace, filterColor: ETrace): boolean {
  if (filterColor === ETrace.ANY) return true;
  return placedColor === filterColor;
}
