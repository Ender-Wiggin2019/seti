import { EResource } from '@seti/common/types/element';
import type {
  IPublicGameState,
  IPublicPlanetaryBoard,
  IPublicPlayerState,
  IPublicSector,
  IPublicTechBoard,
} from '@seti/common/types/protocol/gameState';
import type { TGameEvent } from '@/engine/event/GameEvent.js';
import type { IGame } from '@/engine/IGame.js';
import {
  type IMissionEvent,
  type IMissionRuntimeState,
} from '@/engine/missions/IMission.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { toPublicSolarSystemState } from '@/engine/utils/stateProjection.js';
import type {
  IAlienStateDto,
  IGameStateDto,
  IGoldTileDto,
  IMilestoneStateDto,
  IMissionTrackerDto,
  IPlanetaryBoardDto,
  ISectorDto,
  ISolarSystemDto,
  ITechBoardDto,
} from '../dto/GameStateDto.js';
import type { IPlayerStateDto } from '../dto/PlayerStateDto.js';

interface ISectorInternalState {
  winnerRewardValue: number;
  nextDataTokenId: number;
  nextTimestamp: number;
  markerHistory: Array<{ playerId: string; timestamp: number }>;
}

interface IMilestoneBucketState {
  threshold: number;
  resolvedPlayerIds: Set<string>;
}

interface INeutralMilestoneBucketState extends IMilestoneBucketState {
  markersRemaining: number;
}

interface IMilestoneInternalState {
  goldMilestones: IMilestoneBucketState[];
  neutralMilestones: INeutralMilestoneBucketState[];
}

interface IMissionTrackerInternalState {
  missionsByPlayer: Map<string, IMissionRuntimeState[]>;
  eventBuffer: IMissionEvent[];
}

interface ITechBoardInternalState {
  playerTechs: Map<string, Set<string>>;
}

interface IDataInternalState {
  stashCountValue: number;
}

interface IPlayerInternalState {
  moveStashCount: number;
  pendingCardDrawCount: number;
  pendingAnyCardDrawCount: number;
}

interface ISolarSystemInternalState {
  probeCounter: number;
  publicityByPlayer: Map<string, number>;
}

function cloneValue<TValue>(value: TValue): TValue {
  return JSON.parse(JSON.stringify(value)) as TValue;
}

function serializePlayer(player: IPlayer): IPlayerStateDto {
  const playerInternal = player as unknown as IPlayerInternalState;
  const dataInternal = player.data as unknown as IDataInternalState;

  return {
    id: player.id,
    name: player.name,
    color: player.color,
    seatIndex: player.seatIndex,
    score: player.score,
    passed: player.passed,
    probesInSpace: player.probesInSpace,
    probeSpaceLimit: player.probeSpaceLimit,
    handLimitAfterPass: player.handLimitAfterPass,
    resources: player.resources.toObject(),
    income: {
      base: player.income.baseIncome,
      tucked: player.income.tuckedCardIncome,
    },
    traces: cloneValue(player.traces),
    techs: [...player.techs],
    hand: cloneValue(player.hand),
    playedMissions: cloneValue(player.playedMissions),
    completedMissions: cloneValue(player.completedMissions),
    endGameCards: cloneValue(player.endGameCards),
    tuckedIncomeCards: cloneValue(player.tuckedIncomeCards),
    moveStashCount: playerInternal.moveStashCount,
    pendingCardDrawCount: playerInternal.pendingCardDrawCount,
    pendingAnyCardDrawCount: playerInternal.pendingAnyCardDrawCount,
    dataState: {
      pool: player.data.dataPool.count,
      stash: dataInternal.stashCountValue,
      poolMax: player.data.dataPool.max,
      computerTopSlots: [...player.data.computer.getTopSlots()],
      computerBottomSlots: [...player.data.computer.getBottomSlots()],
    },
    pieces: {
      totalInventory: {
        [EPieceType.PROBE]:
          player.pieces.available(EPieceType.PROBE) +
          player.pieces.deployed(EPieceType.PROBE),
        [EPieceType.ORBITER]:
          player.pieces.available(EPieceType.ORBITER) +
          player.pieces.deployed(EPieceType.ORBITER),
        [EPieceType.LANDER]:
          player.pieces.available(EPieceType.LANDER) +
          player.pieces.deployed(EPieceType.LANDER),
        [EPieceType.SECTOR_MARKER]:
          player.pieces.available(EPieceType.SECTOR_MARKER) +
          player.pieces.deployed(EPieceType.SECTOR_MARKER),
      },
      deployedInventory: {
        [EPieceType.PROBE]: player.pieces.deployed(EPieceType.PROBE),
        [EPieceType.ORBITER]: player.pieces.deployed(EPieceType.ORBITER),
        [EPieceType.LANDER]: player.pieces.deployed(EPieceType.LANDER),
        [EPieceType.SECTOR_MARKER]: player.pieces.deployed(
          EPieceType.SECTOR_MARKER,
        ),
      },
    },
    waitingFor: null,
    resourceByType: {
      [EResource.CREDIT]: player.resources.credits,
      [EResource.ENERGY]: player.resources.energy,
      [EResource.PUBLICITY]: player.resources.publicity,
      [EResource.DATA]: player.resources.data,
    },
  };
}

function serializeSolarSystem(game: IGame): ISolarSystemDto | null {
  if (!game.solarSystem) {
    return null;
  }

  const solarInternal =
    game.solarSystem as unknown as ISolarSystemInternalState;
  const adjacency: Record<string, string[]> = {};
  for (const [spaceId, neighbors] of game.solarSystem.adjacency.entries()) {
    adjacency[spaceId] = [...neighbors];
  }

  return {
    spaces: game.solarSystem.spaces.map((space) => ({
      id: space.id,
      ringIndex: space.ringIndex,
      indexInRing: space.indexInRing,
      discIndex: space.discIndex,
      hasPublicityIcon: space.hasPublicityIcon,
      elements: space.elements.map((element) => ({
        type: element.type,
        amount: element.amount,
        planet: element.planet,
      })),
      occupants: space.occupants.map((probe) => ({
        id: probe.id,
        playerId: probe.playerId,
      })),
    })),
    sectorNearStars: [...game.solarSystem.sectorNearStars],
    discs: game.solarSystem.discs.map((disc) => ({
      index: disc.index,
      currentRotation: disc.currentRotation,
      spaces: [...disc.spaces],
    })),
    adjacency,
    rotationCounter: game.solarSystem.rotationCounter,
    probeCounter: solarInternal.probeCounter,
    publicityByPlayer: Object.fromEntries(
      solarInternal.publicityByPlayer.entries(),
    ),
  };
}

function serializePlanetaryBoard(game: IGame): IPlanetaryBoardDto | null {
  if (!game.planetaryBoard) {
    return null;
  }

  const boardInternal = game.planetaryBoard as unknown as {
    probesByPlanet: Map<string, Map<string, number>>;
  };

  return {
    planets: [...game.planetaryBoard.planets.entries()].map(
      ([planet, state]) => ({
        planet,
        state: {
          orbitSlots: state.orbitSlots.map((slot) => ({ ...slot })),
          landingSlots: state.landingSlots.map((slot) => ({ ...slot })),
          firstOrbitClaimed: state.firstOrbitClaimed,
          firstLandDataBonusTaken: [...state.firstLandDataBonusTaken],
          moonOccupant: state.moonOccupant ? { ...state.moonOccupant } : null,
          moonUnlocked: state.moonUnlocked,
          planetSpaceId: state.planetSpaceId,
        },
      }),
    ),
    probesByPlanet: [...boardInternal.probesByPlanet.entries()].map(
      ([planet, probes]) => ({
        planet: planet as never,
        probes: Object.fromEntries(probes.entries()),
      }),
    ),
  };
}

function serializeTechBoard(game: IGame): ITechBoardDto | null {
  if (!game.techBoard) {
    return null;
  }

  const techInternal = game.techBoard as unknown as ITechBoardInternalState;
  return {
    stacks: [...game.techBoard.stacks.values()].map((stack) => ({
      techId: stack.techId,
      category: stack.category,
      level: stack.level,
      tiles: stack.tiles.map((tile) => ({
        bonus: tile.bonus,
      })),
      firstTakeBonusAvailable: stack.firstTakeBonusAvailable,
    })),
    playerTechs: [...techInternal.playerTechs.entries()].map(
      ([playerId, techIds]) => ({
        playerId,
        techIds: [...techIds] as never,
      }),
    ),
  };
}

function serializeSectors(game: IGame): ISectorDto[] {
  return game.sectors.map((sector) => {
    const internal = sector as unknown as ISectorInternalState;
    return {
      id: sector.id,
      color: sector.color,
      dataSlots: [...sector.dataSlots],
      markerSlots: sector.markerSlots.map((marker) => ({ ...marker })),
      overflowMarkers: sector.overflowMarkers.map((marker) => ({ ...marker })),
      winnerMarkers: sector.winnerMarkers.map((marker) => ({ ...marker })),
      completed: sector.completed,
      winnerRewardValue: internal.winnerRewardValue,
      nextDataTokenId: internal.nextDataTokenId,
      nextTimestamp: internal.nextTimestamp,
      markerHistory: internal.markerHistory.map((marker) => ({ ...marker })),
    };
  });
}

function serializeAlienState(game: IGame): IAlienStateDto {
  return {
    hiddenAliens: [...game.hiddenAliens],
    discovered: [],
  };
}

function serializeMilestoneState(game: IGame): IMilestoneStateDto {
  const milestoneInternal =
    game.milestoneState as unknown as IMilestoneInternalState;
  return {
    neutralMilestoneThresholds: [...game.neutralMilestones],
    neutralDiscoveryMarkersCapacity: 6,
    neutralDiscoveryMarkersUsed:
      game.milestoneState.getNeutralDiscoveryMarkersUsed(),
    goldMilestones: milestoneInternal.goldMilestones.map((milestone) => ({
      threshold: milestone.threshold,
      resolvedPlayerIds: [...milestone.resolvedPlayerIds],
    })),
    neutralMilestones: milestoneInternal.neutralMilestones.map((milestone) => ({
      threshold: milestone.threshold,
      markersRemaining: milestone.markersRemaining,
      resolvedPlayerIds: [...milestone.resolvedPlayerIds],
    })),
  };
}

function serializeGoldTiles(game: IGame): IGoldTileDto[] {
  return game.goldScoringTiles.map((tile) => ({
    id: tile.id,
    side: tile.side,
    slotValues: [...tile.slotValues],
    claims: tile.claims.map((claim) => ({ ...claim })),
  }));
}

function serializeMissionTracker(game: IGame): IMissionTrackerDto {
  const missionInternal =
    game.missionTracker as unknown as IMissionTrackerInternalState;
  return {
    missionsByPlayer: [...missionInternal.missionsByPlayer.entries()].map(
      ([playerId, missions]) => ({
        playerId,
        missions: cloneValue(missions),
      }),
    ),
    eventBuffer: cloneValue(missionInternal.eventBuffer),
  };
}

export function serializeGame(game: IGame, version = 0): IGameStateDto {
  return {
    gameId: game.id,
    version,
    seed: game.seed,
    rngState: game.random.getState(),
    options: cloneValue(game.options),
    round: game.round,
    phase: game.phase,
    currentPlayerId: game.activePlayer.id,
    startPlayerId: game.startPlayer.id,
    hasRoundFirstPassOccurred: game.hasRoundFirstPassOccurred,
    rotationCounter: game.rotationCounter,
    roundRotationReminderIndex: game.roundRotationReminderIndex,

    solarSystem: serializeSolarSystem(game),
    solarSystemSetup: game.solarSystemSetup
      ? cloneValue(game.solarSystemSetup)
      : null,
    planetaryBoard: serializePlanetaryBoard(game),
    techBoard: serializeTechBoard(game),
    sectors: serializeSectors(game),
    alienState: serializeAlienState(game),

    mainDeck: {
      drawPile: [...game.mainDeck.getDrawPile()],
      discardPile: [...game.mainDeck.getDiscardPile()],
    },
    cardRow: cloneValue(game.cardRow),
    endOfRoundStacks: cloneValue(game.endOfRoundStacks),

    players: game.players.map((player) => serializePlayer(player)),
    eventLog: cloneValue(game.eventLog.toArray() as TGameEvent[]),

    milestones: serializeMilestoneState(game),
    goldScoringTiles: serializeGoldTiles(game),
    missionTracker: serializeMissionTracker(game),
  };
}

function toPublicPlayerState(
  player: IPlayer,
  viewerId: string,
): IPublicPlayerState {
  const isViewer = player.id === viewerId;
  return {
    playerId: player.id,
    playerName: player.name,
    seatIndex: player.seatIndex,
    color: player.color,
    score: player.score,
    handSize: player.hand.length,
    hand: isViewer ? cloneValue(player.hand as never) : undefined,
    resources: {
      [EResource.CREDIT]: player.resources.credits,
      [EResource.ENERGY]: player.resources.energy,
      [EResource.DATA]: player.resources.data,
      [EResource.PUBLICITY]: player.resources.publicity,
    },
    traces: cloneValue(player.traces),
    computer: {
      topSlots: player.computer
        .getTopSlots()
        .map((filled) => (filled ? 'data' : null)),
      bottomSlots: player.computer
        .getBottomSlots()
        .map((filled) => (filled ? 'data' : null)),
    },
    dataPoolCount: player.dataPool.count,
    dataPoolMax: player.dataPool.max,
    pieces: {
      probes: player.pieces.available(EPieceType.PROBE),
      orbiters: player.pieces.available(EPieceType.ORBITER),
      landers: player.pieces.available(EPieceType.LANDER),
      signalMarkers: player.pieces.available(EPieceType.SECTOR_MARKER),
    },
    techs: [...player.techs],
    passed: player.passed,
    movementPoints: (player as unknown as IPlayerInternalState).moveStashCount,
    dataStashCount: (player.data as unknown as IDataInternalState)
      .stashCountValue,
    probesInSpace: player.probesInSpace,
    probeSpaceLimit: player.probeSpaceLimit,
  };
}

function toPublicPlanetaryBoard(game: IGame): IPublicPlanetaryBoard {
  if (!game.planetaryBoard) {
    return { planets: {} };
  }

  const planets: IPublicPlanetaryBoard['planets'] = {};
  for (const [planet, state] of game.planetaryBoard.planets.entries()) {
    planets[planet] = {
      orbitSlots: state.orbitSlots.map((slot) => ({ ...slot })),
      landingSlots: state.landingSlots.map((slot) => ({ ...slot })),
      firstOrbitClaimed: state.firstOrbitClaimed,
      firstLandDataBonusTaken: [...state.firstLandDataBonusTaken],
      moonOccupant: state.moonOccupant ? { ...state.moonOccupant } : null,
      moonUnlocked: state.moonUnlocked,
      planetSpaceId: state.planetSpaceId,
    };
  }

  return { planets };
}

function toPublicSectors(game: IGame): IPublicSector[] {
  return game.sectors.map((sector) => ({
    sectorId: sector.id,
    color: sector.color,
    dataSlots: [...sector.dataSlots],
    markerSlots: [...sector.markerSlots],
    completed: sector.completed,
  }));
}

function toPublicTechBoard(game: IGame): IPublicTechBoard {
  if (!game.techBoard) {
    return { stacks: [] };
  }

  return game.techBoard.toPublicState();
}

export function projectGameState(
  game: IGame,
  viewerId: string,
): IPublicGameState {
  if (!game.solarSystem) {
    throw new Error('solarSystem is required to project game state');
  }

  return {
    gameId: game.id,
    round: game.round,
    phase: game.phase,
    currentPlayerId: game.activePlayer.id,
    startPlayerId: game.startPlayer.id,
    players: game.players.map((player) =>
      toPublicPlayerState(player, viewerId),
    ),
    solarSystem: toPublicSolarSystemState(game.solarSystem),
    sectors: toPublicSectors(game),
    solarSystemSetup: game.solarSystemSetup ?? undefined,
    planetaryBoard: toPublicPlanetaryBoard(game),
    techBoard: toPublicTechBoard(game),
    cardRow: cloneValue(game.cardRow as never),
    endOfRoundStacks: cloneValue(game.endOfRoundStacks as never),
    currentEndOfRoundStackIndex: game.roundRotationReminderIndex,
    aliens: [],
    recentEvents: game.eventLog.recent(20) as never,
  };
}
