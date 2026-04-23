import type { ISolarSystemSetupConfig } from '@seti/common/constant/sectorSetup';
import { IBaseCard } from '@seti/common/types/BaseCard';
import type { IComputerSlotReward } from '@seti/common/types/computer';
import { EResource, ESector } from '@seti/common/types/element';
import {
  EAlienType,
  EPhase,
  EPlanet,
  ETech,
  ETrace,
} from '@seti/common/types/protocol/enums';
import type { TGameEvent } from '@seti/common/types/protocol/events';
import type { ETechId } from '@seti/common/types/tech';

export interface IPublicResourceState {
  [EResource.CREDIT]: number;
  [EResource.ENERGY]: number;
  [EResource.DATA]: number;
  [EResource.PUBLICITY]: number;
}

export interface IPublicComputerColumnState {
  topFilled: boolean;
  topReward: IComputerSlotReward | null;
  techId: ETechId | null;
  hasBottomSlot: boolean;
  bottomFilled: boolean;
  bottomReward: IComputerSlotReward | null;
  techSlotAvailable: boolean;
}

export interface IPublicComputerState {
  columns: IPublicComputerColumnState[];
}

export interface IPublicPieceInventory {
  probes: number;
  orbiters: number;
  landers: number;
  signalMarkers: number;
}

export interface IPublicPlayerState {
  playerId: string;
  playerName: string;
  seatIndex: number;
  color: string;
  score: number;
  handSize: number;
  hand?: IBaseCard[];
  resources: IPublicResourceState;
  traces: Partial<Record<ETrace, number>>;
  tracesByAlien: Record<number, Partial<Record<ETrace, number>>>;
  computer: IPublicComputerState;
  dataPoolCount: number;
  dataPoolMax: number;
  pieces: IPublicPieceInventory;
  techs: ETechId[];
  passed: boolean;
  movementPoints: number;
  dataStashCount: number;
  probesInSpace: number;
  probeSpaceLimit: number;
  tuckedIncomeCards?: IBaseCard[];
  playedMissions?: IBaseCard[];
  completedMissions?: string[];
  endGameCards?: IBaseCard[];
  completedMissionCount: number;
  endGameCardCount: number;
  creditIncome: number;
  energyIncome: number;
  cardIncome: number;
  /**
   * Number of setup-tuck inputs this player still owes. `0` / undefined
   * means setup is complete for this player. Broadcast publicly so
   * peers can reflect "waiting for all players to finish setup" in the
   * UI (e.g. disable the PASS button until every peer has
   * pendingSetupTucks === 0). Marked optional so stale/minimal fixture
   * consumers can omit it and default to 0.
   */
  pendingSetupTucks?: number;
  exofossils?: number;
}

export interface IPublicSolarSystemProbe {
  playerId: string;
  spaceId: string;
  probeId?: string;
  transitionDelayMs?: number;
}

export interface IPublicSolarSystemDiscState {
  discIndex: number;
  angle: number;
}

export interface IPublicSolarSystemSpaceState {
  spaceId: string;
  ringIndex: number;
  indexInRing: number;
  hasPublicityIcon: boolean;
  /**
   * Amount of publicity granted when a probe enters this space via the
   * publicity icon. Optional; callers that don't emit this field default
   * to +1 (existing board data) while newer sector configs may specify
   * any positive integer for extensibility.
   */
  publicityIconAmount?: number;
  elementTypes: string[];
  elements?: Array<{ type: string; planet?: EPlanet }>;
  /**
   * Pre-computed sector index (0..7) this space belongs to. Stable per
   * spaceId — does not change on rotation (only the element living on
   * the space does). Emitted by the server projection so clients don't
   * have to replicate `floor(indexInRing / ringIndex)` logic.
   */
  sectorIndex?: number;
  /** Offset inside the owning sector (0..ringIndex-1). */
  cellInSector?: number;
}

export interface IPublicSolarSystemState {
  spaces: string[];
  adjacency: Record<string, string[]>;
  probes: IPublicSolarSystemProbe[];
  discs: IPublicSolarSystemDiscState[];
  /**
   * Next ring that will rotate when a rotation resolves (rule order 1 -> 2 -> 3).
   * Produced by the server from runtime rotation counter; client should render only.
   */
  nextRotateRing?: 1 | 2 | 3;
  spaceStates?: Record<string, IPublicSolarSystemSpaceState>;
  /**
   * Runtime planet → current spaceId lookup. Reflects the current
   * rotation state; server rebuilds on every rotation so clients can
   * highlight planet targets in O(1) without scanning `spaceStates`.
   */
  planetSpaceIds?: Partial<Record<EPlanet, string>>;
  /**
   * Static sector → ordered spaceIds (ring-1 first) index. Stable for
   * the whole game. Lets clients render "sector zoom" or sector-scoped
   * probe badges without deriving the topology.
   */
  sectorSpaceIds?: Record<number, string[]>;
  /** probeId → spaceId. Enables probe-centric views (e.g. "which sector?"). */
  probeSpaceById?: Record<string, string>;
}

export type IPublicSolarSystem = IPublicSolarSystemState;

export interface IPublicSectorSignal {
  type: 'data' | 'player';
  playerId?: string;
}

export interface IPublicSectorState {
  sectorId: string;
  color: ESector;
  signals: IPublicSectorSignal[];
  dataSlotCapacity: number;
  sectorWinners: string[];
  completed: boolean;
}

export type IPublicSector = IPublicSectorState;

export interface IPublicPlanetSlotState {
  playerId: string;
}

export interface IPublicMoonOccupantState {
  playerId: string;
}

export interface IPublicPlanetState {
  orbitSlots: IPublicPlanetSlotState[];
  landingSlots: IPublicPlanetSlotState[];
  firstOrbitClaimed: boolean;
  firstLandDataBonusTaken: boolean[];
  moonOccupant: IPublicMoonOccupantState | null;
}

export interface IPublicPlanetaryBoard {
  planets: Partial<Record<EPlanet, IPublicPlanetState>>;
}

export interface IPublicTechStack {
  tech: ETech;
  level: number;
  remainingTiles: number;
  firstTakeBonusAvailable: boolean;
}

export interface IPublicTechBoard {
  stacks: IPublicTechStack[];
}

export type TPublicSlotReward =
  | { type: 'VP'; amount: number }
  | { type: 'PUBLICITY'; amount: number }
  | { type: 'CUSTOM'; effectId: string };

export interface IPublicTraceOccupant {
  source: { playerId: string } | 'neutral';
  traceColor: ETrace;
}

export interface IPublicTraceSlot {
  slotId: string;
  traceColor: ETrace;
  occupants: IPublicTraceOccupant[];
  maxOccupants: number;
  rewards: TPublicSlotReward[];
  isDiscovery: boolean;
}

export interface IPublicAlienState {
  alienIndex: number;
  alienType: EAlienType | null;
  discovered: boolean;
  faceUpAlienCardId?: string | null;
  alienDeckSize?: number;
  alienDiscardSize?: number;
  slots: IPublicTraceSlot[];
}

export interface IPublicMilestoneBucket {
  threshold: number;
  resolvedPlayerIds: string[];
}

export interface IPublicNeutralMilestoneBucket extends IPublicMilestoneBucket {
  markersRemaining: number;
}

export interface IPublicMilestoneState {
  goldMilestones: IPublicMilestoneBucket[];
  neutralMilestones: IPublicNeutralMilestoneBucket[];
}

export interface IPublicGoldScoringTileClaim {
  playerId: string;
  value: number;
}

export interface IPublicGoldScoringTile {
  id: string;
  side: 'A' | 'B';
  slotValues: number[];
  claims: IPublicGoldScoringTileClaim[];
}

export interface IPublicGameState {
  gameId: string;
  round: number;
  phase: EPhase;
  currentPlayerId: string;
  startPlayerId: string;
  players: IPublicPlayerState[];
  solarSystem: IPublicSolarSystem;
  sectors: IPublicSector[];
  solarSystemSetup?: ISolarSystemSetupConfig;
  planetaryBoard: IPublicPlanetaryBoard;
  techBoard: IPublicTechBoard;
  cardRow: IBaseCard[];
  endOfRoundStacks?: IBaseCard[][];
  currentEndOfRoundStackIndex?: number;
  aliens: IPublicAlienState[];
  recentEvents: TGameEvent[];
  milestones: IPublicMilestoneState;
  goldScoringTiles: IPublicGoldScoringTile[];
  /** Whether room-level undo is enabled for this game. */
  undoAllowed: boolean;
  /**
   * Whether the current viewer (if they are the active player) is
   * allowed to press Undo right now. Always false for non-active
   * players. False once the active player's turn is locked (any card
   * drawn from the deck / card row refilled / pass-pile revealed) or
   * when no turn-start checkpoint is available.
   */
  canUndo: boolean;
  /** Monotonic index of the current turn (server-side). */
  turnIndex: number;
}
