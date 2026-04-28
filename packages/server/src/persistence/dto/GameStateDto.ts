import type {
  EStarName,
  ISolarSystemSetupConfig,
  TSectorWinnerBonus,
} from '@seti/common/constant/sectorSetup';
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
  alienTokens: ISolarSystemAlienTokenDto[];
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
      bonuses?: ITechBonusToken[];
    }>;
    firstTakeBonusAvailable: boolean;
  }>;
  playerTechs: Array<{
    playerId: string;
    techIds: ETechId[];
  }>;
}

export interface ISectorSignalDto {
  type: 'data' | 'player';
  tokenId?: string;
  playerId?: string;
}

export interface ISectorDto {
  id: string;
  name?: EStarName | string;
  color: ESector;
  signals: ISectorSignalDto[];
  dataSlotCapacity: number;
  firstWinBonus?: TSectorWinnerBonus;
  repeatWinBonus?: TSectorWinnerBonus;
  sectorWinners: string[];
  completed: boolean;
  nextDataTokenId: number;
}

export interface ITraceSlotDto {
  slotId: string;
  alienIndex: number;
  traceColor: ETrace;
  occupants: Array<{
    source: { playerId: string } | 'neutral';
    traceColor: ETrace;
  }>;
  maxOccupants: number;
  rewards: Array<
    | { type: 'VP'; amount: number }
    | { type: 'PUBLICITY'; amount: number }
    | { type: 'CREDIT'; amount: number }
    | { type: 'ENERGY'; amount: number }
    | { type: 'DATA'; amount: number }
    | { type: 'CARD'; amount: number }
    | { type: 'CUSTOM'; effectId: string }
  >;
  isDiscovery: boolean;
}

export interface ISolarSystemAlienTokenDto {
  tokenId: string;
  alienType: EAlienType;
  sectorIndex: number;
  traceColor: ETrace.RED | ETrace.YELLOW | ETrace.BLUE;
  rewards: ITraceSlotDto['rewards'];
}

export interface IOumuamuaTileDto {
  spaceId: string;
  sectorId: string;
  dataRemaining: number;
  markerPlayerIds: string[];
}

export interface IAlienBoardDto {
  alienType: EAlienType;
  alienIndex: number;
  discovered: boolean;
  discoverySlots: ITraceSlotDto[];
  overflowSlots: ITraceSlotDto[];
  speciesTraceSlots: ITraceSlotDto[];
  anomalyColumns?: ITraceSlotDto[];
  oumuamuaTile?: IOumuamuaTileDto | null;
  alienDeckDrawPile: string[];
  alienDeckDiscardPile: string[];
  faceUpAlienCardId: string | null;
}

export interface IAlienStateDto {
  aliens: IAlienBoardDto[];
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
  turnIndex: number;
  turnLocked: boolean;

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
