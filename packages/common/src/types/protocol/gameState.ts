import type { ISolarSystemSetupConfig } from '@seti/common/constant/sectorSetup';
import { IBaseCard } from '@seti/common/types/BaseCard';
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

export interface IPublicComputerState {
  topSlots: Array<string | null>;
  bottomSlots: Array<string | null>;
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
}

export interface IPublicSolarSystemProbe {
  playerId: string;
  spaceId: string;
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
}

export interface IPublicSolarSystemState {
  spaces: string[];
  adjacency: Record<string, string[]>;
  probes: IPublicSolarSystemProbe[];
  discs: IPublicSolarSystemDiscState[];
  spaceStates?: Record<string, IPublicSolarSystemSpaceState>;
}

export type IPublicSolarSystem = IPublicSolarSystemState;

export interface IPublicSectorMarkerState {
  playerId: string;
  timestamp: number;
}

export interface IPublicSectorState {
  sectorId: string;
  color: ESector;
  dataSlots: Array<string | null>;
  markerSlots: IPublicSectorMarkerState[];
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

export interface IPublicAlienState {
  alienType: EAlienType;
  discovered: boolean;
  traces: Partial<Record<ETrace, number>>;
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
}
