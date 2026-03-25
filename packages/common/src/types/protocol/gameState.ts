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
  techs: ETech[];
  passed: boolean;
}

export interface IPublicSolarSystemProbe {
  playerId: string;
  spaceId: string;
}

export interface IPublicSolarSystemDiscState {
  discIndex: number;
  angle: number;
}

export interface IPublicSolarSystem {
  spaces: string[];
  adjacency: Record<string, string[]>;
  probes: IPublicSolarSystemProbe[];
  discs: IPublicSolarSystemDiscState[];
}

export interface IPublicSector {
  sectorId: string;
  color: ESector;
  dataSlots: Array<string | null>;
  markers: string[];
  completed: boolean;
}

export interface IPublicPlanetState {
  orbitPlayerIds: string[];
  landingPlayerIds: string[];
  firstOrbitClaimed: boolean;
}

export interface IPublicPlanetaryBoard {
  planets: Partial<Record<EPlanet, IPublicPlanetState>>;
}

export interface IPublicTechStack {
  tech: ETech;
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
  planetaryBoard: IPublicPlanetaryBoard;
  techBoard: IPublicTechBoard;
  cardRow: IBaseCard[];
  aliens: IPublicAlienState[];
  recentEvents: TGameEvent[];
}
