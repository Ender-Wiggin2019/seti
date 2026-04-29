import { PLANET_MISSION_CONFIG } from '@seti/common/constant/boardLayout';
import { EResource } from '@seti/common/types/element';
import { ETrace } from '@seti/common/types/protocol/enums';
import type {
  IPublicAlienCardZone,
  IPublicAlienState,
  IPublicAnomaliesBoard,
  IPublicGameState,
  IPublicGoldScoringTile,
  IPublicMilestoneState,
  IPublicOumuamuaBoard,
  IPublicPlanetaryBoard,
  IPublicPlayerState,
  IPublicSector,
  IPublicSolarSystemAlienToken,
  IPublicTechBoard,
  IPublicTraceSlot,
  TPublicAlienBoard,
  TPublicAnomalyTraceColor,
} from '@seti/common/types/protocol/gameState';
import {
  type AlienBoard,
  type AnomaliesAlienBoard,
  type ITraceSlot,
  isAnomaliesAlienBoard,
  isOumuamuaAlienBoard,
  type OumuamuaAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import type { TGameEvent } from '@/engine/event/GameEvent.js';
import type { IGame } from '@/engine/IGame.js';
import {
  type IMissionEvent,
  type IMissionRuntimeState,
} from '@/engine/missions/IMission.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { buildTechTileBonuses } from '@/engine/tech/TechBonusConfig.js';
import { TechModifierQuery } from '@/engine/tech/TechModifierQuery.js';
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
  ITraceSlotDto,
} from '../dto/GameStateDto.js';
import type { IPlayerStateDto } from '../dto/PlayerStateDto.js';

interface ISectorInternalState {
  nextDataTokenId: number;
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

const ANOMALY_TRACE_COLORS: readonly TPublicAnomalyTraceColor[] = [
  ETrace.RED,
  ETrace.YELLOW,
  ETrace.BLUE,
];

function toPublicTraceSlot(slot: ITraceSlot): IPublicTraceSlot {
  return {
    slotId: slot.slotId,
    traceColor: slot.traceColor,
    occupants: slot.occupants.map((occ) => ({
      source:
        occ.source === 'neutral'
          ? ('neutral' as const)
          : { playerId: occ.source.playerId },
      traceColor: occ.traceColor,
    })),
    maxOccupants: slot.maxOccupants,
    rewards: slot.rewards.map((r) => ({ ...r })),
    isDiscovery: slot.isDiscovery,
  };
}

function toTraceSlotDto(slot: ITraceSlot): ITraceSlotDto {
  return {
    slotId: slot.slotId,
    alienIndex: slot.alienIndex,
    traceColor: slot.traceColor,
    occupants: slot.occupants.map((occ) => ({
      source:
        occ.source === 'neutral'
          ? ('neutral' as const)
          : { playerId: occ.source.playerId },
      traceColor: occ.traceColor,
    })),
    maxOccupants: slot.maxOccupants,
    rewards: slot.rewards.map((r) => ({ ...r })),
    isDiscovery: slot.isDiscovery,
  };
}

function toPublicAlienCardZone(board: AlienBoard): IPublicAlienCardZone {
  return {
    faceUpCardId: board.faceUpAlienCardId,
    drawPileSize: board.alienDeckDrawPile.length,
    discardPileSize: board.alienDeckDiscardPile.length,
  };
}

function toPublicAnomaliesBoard(
  board: AnomaliesAlienBoard,
): IPublicAnomaliesBoard {
  const columns = Object.fromEntries(
    ANOMALY_TRACE_COLORS.map((color) => [
      color,
      toPublicTraceSlot(
        board.anomalyColumns.find((slot) => slot.traceColor === color) ??
          createEmptyAnomalyColumn(board.alienIndex, color),
      ),
    ]),
  ) as Record<TPublicAnomalyTraceColor, IPublicTraceSlot>;

  return {
    type: 'anomalies',
    traceBoard: { columns },
  };
}

function toPublicOumuamuaBoard(
  board: OumuamuaAlienBoard,
): IPublicOumuamuaBoard {
  return {
    type: 'oumuamua',
    tile: board.oumuamuaTile
      ? {
          ...board.oumuamuaTile,
          markerPlayerIds: [...board.oumuamuaTile.markerPlayerIds],
        }
      : null,
    traceSlots: board.speciesTraceSlots.map((slot) => toPublicTraceSlot(slot)),
  };
}

function toPublicAlienBoard(board: AlienBoard): TPublicAlienBoard {
  if (isAnomaliesAlienBoard(board)) {
    return toPublicAnomaliesBoard(board);
  }
  if (isOumuamuaAlienBoard(board)) {
    return toPublicOumuamuaBoard(board);
  }
  return {
    type: 'generic',
    slots: board.speciesTraceSlots.map((slot) => toPublicTraceSlot(slot)),
  };
}

function toPublicAlienState(board: AlienBoard): IPublicAlienState {
  if (board.overflowSlots.length === 0) {
    throw new Error(`Alien ${board.alienIndex} is missing overflow state`);
  }

  return {
    alienIndex: board.alienIndex,
    alienType: board.discovered ? board.alienType : null,
    discovered: board.discovered,
    discovery: {
      zones: board.discoverySlots.map((slot) => toPublicTraceSlot(slot)),
      overflowZones: board.overflowSlots.map((slot) => toPublicTraceSlot(slot)),
    },
    cardZone: board.discovered ? toPublicAlienCardZone(board) : null,
    board: board.discovered ? toPublicAlienBoard(board) : null,
  };
}

function createEmptyAnomalyColumn(
  alienIndex: number,
  traceColor: TPublicAnomalyTraceColor,
): ITraceSlot {
  return {
    slotId: `alien-${alienIndex}-anomaly-column|${traceColor}`,
    alienIndex,
    traceColor,
    occupants: [],
    maxOccupants: -1,
    rewards: [],
    isDiscovery: false,
  };
}

function toPublicSolarAlienTokens(game: IGame): IPublicSolarSystemAlienToken[] {
  return (game.solarSystem?.alienTokens ?? []).flatMap((token) => {
    const board = game.alienState.getBoardByType(token.alienType);
    if (!board?.discovered) return [];
    return [
      {
        tokenId: token.tokenId,
        alienType: token.alienType,
        sectorIndex: token.sectorIndex,
        traceColor: token.traceColor,
        rewards: token.rewards.map((reward) => ({ ...reward })),
      },
    ];
  });
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
    pendingSetupTucks: player.pendingSetupTucks,
    exofossils: player.exofossils,
    resources: player.resources.toObject(),
    income: {
      base: player.income.baseIncome,
      tucked: player.income.tuckedCardIncome,
    },
    traces: cloneValue(player.traces),
    tracesByAlien: cloneValue(player.tracesByAlien),
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
      computerColumns: player.data.computer.getColumnStates().map((col) => ({
        topFilled: col.topFilled,
        bottomFilled: col.bottomFilled,
        techId: col.techId,
        ...(col.bottomReward ? { bottomReward: col.bottomReward } : {}),
      })),
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
    alienTokens: game.solarSystem.alienTokens.map((token) => ({
      tokenId: token.tokenId,
      alienType: token.alienType,
      sectorIndex: token.sectorIndex,
      traceColor: token.traceColor,
      rewards: token.rewards.map((reward) => ({ ...reward })),
    })),
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
        bonuses: buildTechTileBonuses(stack.techId, tile.bonus),
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
      name: sector.name,
      color: sector.color,
      signals: sector.signals.map((s) => ({ ...s })),
      dataSlotCapacity: sector.dataSlotCapacity,
      firstWinBonus: sector.firstWinBonus,
      repeatWinBonus: sector.repeatWinBonus,
      sectorWinners: [...sector.sectorWinners],
      completed: sector.completed,
      nextDataTokenId: internal.nextDataTokenId,
    };
  });
}

function serializeAlienState(game: IGame): IAlienStateDto {
  return {
    aliens: game.alienState.boards.map((board) => {
      const dto: IAlienStateDto['aliens'][number] = {
        alienType: board.alienType,
        alienIndex: board.alienIndex,
        discovered: board.discovered,
        discoverySlots: board.discoverySlots.map((slot) =>
          toTraceSlotDto(slot),
        ),
        overflowSlots: board.overflowSlots.map((slot) => toTraceSlotDto(slot)),
        speciesTraceSlots: board.speciesTraceSlots.map((slot) =>
          toTraceSlotDto(slot),
        ),
        alienDeckDrawPile: [...board.alienDeckDrawPile],
        alienDeckDiscardPile: [...board.alienDeckDiscardPile],
        faceUpAlienCardId: board.faceUpAlienCardId,
        oumuamuaTile:
          isOumuamuaAlienBoard(board) && board.oumuamuaTile
            ? {
                ...board.oumuamuaTile,
                markerPlayerIds: [...board.oumuamuaTile.markerPlayerIds],
              }
            : null,
      };

      if (isAnomaliesAlienBoard(board)) {
        dto.anomalyColumns = board.anomalyColumns.map((slot) =>
          toTraceSlotDto(slot),
        );
      }

      return dto;
    }),
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
    turnIndex: game.turnIndex,
    turnLocked: game.turnLocked,

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
  const effectiveProbeSpaceLimit = TechModifierQuery.fromTechIds(
    player.techs,
  ).getProbeSpaceLimit(player.probeSpaceLimit);
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
    tracesByAlien: cloneValue(player.tracesByAlien),
    computer: {
      columns: player.computer.getColumnStates().map((col) => ({
        topFilled: col.topFilled,
        topReward: col.topReward,
        techId: col.techId,
        hasBottomSlot: col.hasBottomSlot,
        bottomFilled: col.bottomFilled,
        bottomReward: col.bottomReward,
        techSlotAvailable: col.techSlotAvailable,
      })),
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
    probeSpaceLimit: effectiveProbeSpaceLimit,
    tuckedIncomeCards: isViewer
      ? cloneValue(player.tuckedIncomeCards as never)
      : undefined,
    playedMissions: isViewer
      ? cloneValue(player.playedMissions as never)
      : undefined,
    completedMissions: isViewer
      ? (cloneValue(player.completedMissions) as string[])
      : undefined,
    completedMissionCount: player.completedMissions.length,
    endGameCards: isViewer
      ? cloneValue(player.endGameCards as never)
      : undefined,
    endGameCardCount: player.endGameCards.length,
    creditIncome: player.income.computeRoundPayout()[EResource.CREDIT],
    energyIncome: player.income.computeRoundPayout()[EResource.ENERGY],
    cardIncome: player.income.computeRoundPayout()[EResource.CARD],
    pendingSetupTucks: player.pendingSetupTucks,
    exofossils: player.exofossils,
  } as IPublicPlayerState;
}

function toPublicPlanetaryBoard(game: IGame): IPublicPlanetaryBoard {
  if (!game.planetaryBoard) {
    return { configs: { ...PLANET_MISSION_CONFIG }, planets: {} };
  }

  const planets: IPublicPlanetaryBoard['planets'] = {};
  for (const [planet, state] of game.planetaryBoard.planets.entries()) {
    planets[planet] = {
      orbitSlots: state.orbitSlots.map((slot) => ({ ...slot })),
      landingSlots: state.landingSlots.map((slot) => ({ ...slot })),
      firstOrbitClaimed: state.firstOrbitClaimed,
      firstLandDataBonusTaken: [...state.firstLandDataBonusTaken],
      moonOccupant: state.moonOccupant ? { ...state.moonOccupant } : null,
    };
  }

  return { configs: { ...PLANET_MISSION_CONFIG }, planets };
}

function toPublicSectors(game: IGame): IPublicSector[] {
  return game.sectors.map((sector) => sector.toPublicState());
}

function toPublicTechBoard(game: IGame): IPublicTechBoard {
  if (!game.techBoard) {
    return { stacks: [] };
  }

  return game.techBoard.toPublicState();
}

function toPublicMilestones(game: IGame): IPublicMilestoneState {
  const milestoneInternal =
    game.milestoneState as unknown as IMilestoneInternalState;
  return {
    goldMilestones: milestoneInternal.goldMilestones.map((m) => ({
      threshold: m.threshold,
      resolvedPlayerIds: [...m.resolvedPlayerIds],
    })),
    neutralMilestones: milestoneInternal.neutralMilestones.map((m) => ({
      threshold: m.threshold,
      markersRemaining: m.markersRemaining,
      resolvedPlayerIds: [...m.resolvedPlayerIds],
    })),
  };
}

function toPublicGoldScoringTiles(game: IGame): IPublicGoldScoringTile[] {
  return game.goldScoringTiles.map((tile) => ({
    id: tile.id,
    side: tile.side,
    slotValues: [...tile.slotValues],
    claims: tile.claims.map((c) => ({ ...c })),
  }));
}

export interface IProjectGameStateOptions {
  /**
   * Whether a turn-start checkpoint exists in memory (or was restored
   * from DB) that could be used to roll back the current turn. Only
   * meaningful when the viewer is the active player and the turn is
   * not locked.
   */
  hasTurnCheckpoint?: boolean;
}

export function projectGameState(
  game: IGame,
  viewerId: string,
  options: IProjectGameStateOptions = {},
): IPublicGameState {
  if (!game.solarSystem) {
    throw new Error('solarSystem is required to project game state');
  }

  const undoAllowed = game.options.undoAllowed;
  const canUndo =
    undoAllowed &&
    !game.turnLocked &&
    game.activePlayer.id === viewerId &&
    Boolean(options.hasTurnCheckpoint);

  return {
    gameId: game.id,
    round: game.round,
    phase: game.phase,
    currentPlayerId: game.activePlayer.id,
    startPlayerId: game.startPlayer.id,
    undoAllowed,
    canUndo,
    turnIndex: game.turnIndex,
    players: game.players.map((player) =>
      toPublicPlayerState(player, viewerId),
    ),
    solarSystem: toPublicSolarSystemState(
      game.solarSystem,
      toPublicSolarAlienTokens(game),
    ),
    sectors: toPublicSectors(game),
    solarSystemSetup: game.solarSystemSetup ?? undefined,
    planetaryBoard: toPublicPlanetaryBoard(game),
    techBoard: toPublicTechBoard(game),
    cardRow: cloneValue(game.cardRow as never),
    endOfRoundStacks: cloneValue(game.endOfRoundStacks as never),
    currentEndOfRoundStackIndex: game.roundRotationReminderIndex,
    aliens: game.alienState.boards.map((board) => toPublicAlienState(board)),
    recentEvents: game.eventLog.recent(20) as never,
    milestones: toPublicMilestones(game),
    goldScoringTiles: toPublicGoldScoringTiles(game),
  };
}
