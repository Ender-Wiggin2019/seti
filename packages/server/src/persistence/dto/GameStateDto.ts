import type { ISolarSystemSetupConfig } from '@seti/common/constant/sectorSetup';
import type { ESector, ETrace } from '@seti/common/types/element';
import type {
  EAlienType,
  EPhase,
  EPlanet,
} from '@seti/common/types/protocol/enums';
import type {
  ETechId,
  ITechBonusToken,
  TTechCategory,
  TTechLevel,
} from '@seti/common/types/tech';
import type { TGameEvent } from '@/engine/event/GameEvent.js';
import type { IGameOptions } from '@/engine/GameOptions.js';
import type {
  IMissionEvent,
  IMissionRuntimeState,
} from '@/engine/missions/IMission.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import type {
  TGoldScoringTileId,
  TGoldScoringTileSide,
} from '@/engine/scoring/GoldScoringTile.js';
import type { IPlayerStateDto } from './PlayerStateDto.js';

export interface ISerializedDeckDto {
  drawPile: string[];
  discardPile: string[];
}

export interface ISolarSystemDto {
  spaces: Array<{
    id: string;
    ringIndex: number;
    indexInRing: number;
    discIndex: number | null;
    hasPublicityIcon: boolean;
    elements: Array<{
      type: string;
      amount: number;
      planet?: EPlanet;
    }>;
    occupants: Array<{
      id: string;
      playerId: string;
    }>;
  }>;
  sectorNearStars: string[];
  discs: Array<{
    index: number;
    currentRotation: number;
    spaces: string[];
  }>;
  adjacency: Record<string, string[]>;
  rotationCounter: number;
  probeCounter: number;
  publicityByPlayer: Record<string, number>;
}

export interface IPlanetaryBoardDto {
  planets: Array<{
    planet: EPlanet;
    state: {
      orbitSlots: Array<{ playerId: string }>;
      landingSlots: Array<{ playerId: string }>;
      firstOrbitClaimed: boolean;
      firstLandDataBonusTaken: boolean[];
      moonOccupant: { playerId: string } | null;
      moonUnlocked: boolean;
      planetSpaceId?: string;
    };
  }>;
  probesByPlanet: Array<{
    planet: EPlanet;
    probes: Record<string, number>;
  }>;
}

export interface ITechBoardDto {
  stacks: Array<{
    techId: ETechId;
    category: TTechCategory;
    level: TTechLevel;
    tiles: Array<{
      bonus?: ITechBonusToken;
    }>;
    firstTakeBonusAvailable: boolean;
  }>;
  playerTechs: Array<{
    playerId: string;
    techIds: ETechId[];
  }>;
}

export interface ISectorDto {
  id: string;
  color: ESector;
  dataSlots: Array<string | null>;
  markerSlots: Array<{ playerId: string; timestamp: number }>;
  overflowMarkers: Array<{ playerId: string }>;
  winnerMarkers: Array<{ playerId: string; reward: number }>;
  completed: boolean;
  winnerRewardValue: number;
  nextDataTokenId: number;
  nextTimestamp: number;
  markerHistory: Array<{ playerId: string; timestamp: number }>;
}

export interface IAlienStateDto {
  hiddenAliens: EAlienType[];
  discovered: Array<{
    alienType: EAlienType;
    discovered: boolean;
    traces: Partial<Record<ETrace, number>>;
  }>;
}

export interface IMilestoneStateDto {
  neutralMilestoneThresholds: number[];
  neutralDiscoveryMarkersCapacity: number;
  neutralDiscoveryMarkersUsed: number;
  goldMilestones: Array<{
    threshold: number;
    resolvedPlayerIds: string[];
  }>;
  neutralMilestones: Array<{
    threshold: number;
    markersRemaining: number;
    resolvedPlayerIds: string[];
  }>;
}

export interface IGoldTileDto {
  id: TGoldScoringTileId;
  side: TGoldScoringTileSide;
  slotValues: number[];
  claims: Array<{
    playerId: string;
    value: number;
  }>;
}

export interface IMissionTrackerDto {
  missionsByPlayer: Array<{
    playerId: string;
    missions: IMissionRuntimeState[];
  }>;
  eventBuffer: IMissionEvent[];
}

export interface IGameStateDto {
  gameId: string;
  version: number;
  seed: string;
  rngState: number;
  options: IGameOptions;
  round: number;
  phase: EPhase;
  currentPlayerId: string;
  startPlayerId: string;
  hasRoundFirstPassOccurred: boolean;
  rotationCounter: number;
  roundRotationReminderIndex: number;

  solarSystem: ISolarSystemDto | null;
  solarSystemSetup: ISolarSystemSetupConfig | null;
  planetaryBoard: IPlanetaryBoardDto | null;
  techBoard: ITechBoardDto | null;
  sectors: ISectorDto[];
  alienState: IAlienStateDto;

  mainDeck: ISerializedDeckDto;
  cardRow: TCardItem[];
  endOfRoundStacks: TCardItem[][];

  players: IPlayerStateDto[];
  eventLog: TGameEvent[];

  milestones: IMilestoneStateDto;
  goldScoringTiles: IGoldTileDto[];
  missionTracker: IMissionTrackerDto;
}
