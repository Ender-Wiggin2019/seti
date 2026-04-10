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
  elementTypes: string[];
  elements?: Array<{ type: string; planet?: EPlanet }>;
}

export interface IPublicSolarSystemState {
  spaces: string[];
  adjacency: Record<string, string[]>;
  probes: IPublicSolarSystemProbe[];
  discs: IPublicSolarSystemDiscState[];
  spaceStates?: Record<string, IPublicSolarSystemSpaceState>;
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
  moonUnlocked: boolean;
  planetSpaceId?: string;
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
}
