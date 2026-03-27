import { DEFAULT_COLUMN_CONFIGS } from '@seti/common/types/computer';
import { ETrace, type EPlanet } from '@seti/common/types/protocol/enums';
import { AlienState } from '@/engine/alien/AlienState.js';
import {
  type IPlanetState,
  PlanetaryBoard,
} from '@/engine/board/PlanetaryBoard.js';
import { Sector } from '@/engine/board/Sector.js';
import {
  type ISolarSystemSpace,
  SolarSystem,
} from '@/engine/board/SolarSystem.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import { Game } from '@/engine/Game.js';
import type {
  IMissionEvent,
  IMissionRuntimeState,
} from '@/engine/missions/IMission.js';
import { MissionTracker } from '@/engine/missions/MissionTracker.js';
import { Computer } from '@/engine/player/Computer.js';
import type { ComputerColumn } from '@/engine/player/ComputerColumn.js';
import { DataPool } from '@/engine/player/DataPool.js';
import { Income } from '@/engine/player/Income.js';
import { Pieces } from '@/engine/player/Pieces.js';
import { Player } from '@/engine/player/Player.js';
import { Resources } from '@/engine/player/Resources.js';
import { GoldScoringTile } from '@/engine/scoring/GoldScoringTile.js';
import { MilestoneState } from '@/engine/scoring/Milestone.js';
import { type ITechStack, TechBoard } from '@/engine/tech/TechBoard.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import type { IGameStateDto } from '../dto/GameStateDto.js';

interface ITechBoardInternalState {
  playerTechs: Map<string, Set<string>>;
}

interface ISectorInternalState {
  winnerRewardValue: number;
  nextDataTokenId: number;
  nextTimestamp: number;
  markerHistory: Array<{ playerId: string; timestamp: number }>;
}

interface ISolarSystemInternalState {
  probeCounter: number;
  publicityByPlayer: Map<string, number>;
}

interface IPlayerInternalState {
  moveStashCount: number;
  pendingCardDrawCount: number;
  pendingAnyCardDrawCount: number;
}

interface IDataInternalState {
  dataPoolInstance: DataPool;
  computerInstance: Computer;
  stashCountValue: number;
}

interface IComputerColumnInternal {
  topFilledValue: boolean;
  bottomFilledValue: boolean;
  techPlacementValue: { techId: string; bottomReward: unknown } | null;
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
  neutralDiscoveryMarkersUsed: number;
}

interface IMissionTrackerInternalState {
  missionsByPlayer: Map<string, IMissionRuntimeState[]>;
  eventBuffer: IMissionEvent[];
}

function cloneValue<TValue>(value: TValue): TValue {
  return JSON.parse(JSON.stringify(value)) as TValue;
}

function deserializeSolarSystem(dto: IGameStateDto): SolarSystem | null {
  if (!dto.solarSystem) {
    return null;
  }

  const spaces: ISolarSystemSpace[] = dto.solarSystem.spaces.map((space) => ({
    id: space.id,
    ringIndex: space.ringIndex,
    indexInRing: space.indexInRing,
    discIndex: space.discIndex,
    hasPublicityIcon: space.hasPublicityIcon,
    elements: space.elements.map((element) => ({
      ...element,
      type: element.type as never,
    })),
    occupants: space.occupants.map((probe) => ({ ...probe })),
  }));

  const solarSystem = new SolarSystem(spaces, dto.solarSystem.sectorNearStars);
  for (const disc of dto.solarSystem.discs) {
    if (solarSystem.discs[disc.index]) {
      solarSystem.discs[disc.index].currentRotation = disc.currentRotation;
      solarSystem.discs[disc.index].spaces = [...disc.spaces];
    }
  }
  solarSystem.rotationCounter = dto.solarSystem.rotationCounter;

  const internal = solarSystem as unknown as ISolarSystemInternalState;
  internal.probeCounter = dto.solarSystem.probeCounter;
  internal.publicityByPlayer = new Map(
    Object.entries(dto.solarSystem.publicityByPlayer),
  );

  return solarSystem;
}

function deserializePlanetaryBoard(dto: IGameStateDto): PlanetaryBoard | null {
  if (!dto.planetaryBoard) {
    return null;
  }

  const board = new PlanetaryBoard();
  board.planets.clear();
  for (const entry of dto.planetaryBoard.planets) {
    board.planets.set(entry.planet, cloneValue(entry.state) as IPlanetState);
  }

  const internal = board as unknown as {
    probesByPlanet: Map<EPlanet, Map<string, number>>;
  };
  internal.probesByPlanet = new Map(
    dto.planetaryBoard.probesByPlanet.map((entry) => [
      entry.planet,
      new Map(
        Object.entries(entry.probes).map(([playerId, count]) => [
          playerId,
          Number(count),
        ]),
      ),
    ]),
  );

  return board;
}

function deserializeTechBoard(dto: IGameStateDto): TechBoard | null {
  if (!dto.techBoard) {
    return null;
  }

  const techBoard = new TechBoard(new SeededRandom('deserialize-tech'));
  const sourceBoard = new TechBoard(
    new SeededRandom('deserialize-tech-source'),
  );
  techBoard.stacks.clear();
  for (const stackDto of dto.techBoard.stacks) {
    const sourceStack = sourceBoard.getStack(stackDto.techId);
    if (!sourceStack) {
      continue;
    }

    const stack: ITechStack = {
      techId: stackDto.techId,
      category: stackDto.category,
      level: stackDto.level,
      firstTakeBonusAvailable: stackDto.firstTakeBonusAvailable,
      tiles: stackDto.tiles.map((tileDto, index) => ({
        tech: sourceStack.tiles[index % sourceStack.tiles.length].tech,
        bonus: tileDto.bonus,
      })),
    };

    techBoard.stacks.set(stackDto.techId, stack);
  }

  const internal = techBoard as unknown as ITechBoardInternalState;
  internal.playerTechs = new Map(
    dto.techBoard.playerTechs.map((entry) => [
      entry.playerId,
      new Set(entry.techIds),
    ]),
  );

  return techBoard;
}

function deserializeSectors(dto: IGameStateDto): Sector[] {
  return dto.sectors.map((sectorDto) => {
    const sector = new Sector({
      id: sectorDto.id,
      color: sectorDto.color,
      dataSlotCapacity: sectorDto.dataSlots.length,
      winnerReward: sectorDto.winnerRewardValue,
    });

    for (let index = 0; index < sector.dataSlots.length; index += 1) {
      sector.dataSlots[index] = sectorDto.dataSlots[index] ?? null;
    }
    sector.markerSlots.splice(
      0,
      sector.markerSlots.length,
      ...sectorDto.markerSlots.map((marker) => ({ ...marker })),
    );
    sector.overflowMarkers.splice(
      0,
      sector.overflowMarkers.length,
      ...sectorDto.overflowMarkers.map((marker) => ({ ...marker })),
    );
    sector.winnerMarkers.splice(
      0,
      sector.winnerMarkers.length,
      ...sectorDto.winnerMarkers.map((marker) => ({ ...marker })),
    );
    sector.completed = sectorDto.completed;

    const internal = sector as unknown as ISectorInternalState;
    internal.nextDataTokenId = sectorDto.nextDataTokenId;
    internal.nextTimestamp = sectorDto.nextTimestamp;
    internal.markerHistory = sectorDto.markerHistory.map((marker) => ({
      ...marker,
    }));
    return sector;
  });
}

function deserializePlayers(game: Game, dto: IGameStateDto): void {
  for (const playerDto of dto.players) {
    const player = game.players.find(
      (candidate) => candidate.id === playerDto.id,
    );
    if (!player) {
      continue;
    }

    player.score = playerDto.score;
    player.passed = playerDto.passed;
    player.probesInSpace = playerDto.probesInSpace;
    player.probeSpaceLimit = playerDto.probeSpaceLimit;
    player.handLimitAfterPass = playerDto.handLimitAfterPass;

    const concretePlayer = player as Player;
    const dataInternal = concretePlayer.data as unknown as IDataInternalState;
    dataInternal.dataPoolInstance = new DataPool(
      playerDto.dataState.pool,
      playerDto.dataState.poolMax,
    );
    dataInternal.computerInstance = new Computer(DEFAULT_COLUMN_CONFIGS);
    const computerInternal = dataInternal.computerInstance as unknown as {
      columns: ComputerColumn[];
    };
    for (let i = 0; i < playerDto.dataState.computerColumns.length; i++) {
      const colDto = playerDto.dataState.computerColumns[i];
      const col = computerInternal.columns[i] as unknown as IComputerColumnInternal;
      if (!col) continue;
      if (colDto.techId) {
        col.techPlacementValue = {
          techId: colDto.techId,
          bottomReward: colDto.bottomReward ?? {},
        };
      }
      col.topFilledValue = colDto.topFilled;
      col.bottomFilledValue = colDto.bottomFilled;
    }
    dataInternal.stashCountValue = playerDto.dataState.stash;

    concretePlayer.resources = new Resources(
      {
        credits: playerDto.resources.credits,
        energy: playerDto.resources.energy,
        publicity: playerDto.resources.publicity,
        data: 0,
      },
      { dataController: concretePlayer.data },
    );
    concretePlayer.income = new Income(
      playerDto.income.base,
      playerDto.income.tucked,
    );
    concretePlayer.pieces = new Pieces(playerDto.pieces.totalInventory);
    (
      concretePlayer.pieces as unknown as {
        deployedInventory: Record<string, number>;
      }
    ).deployedInventory = {
      ...playerDto.pieces.deployedInventory,
    };

    concretePlayer.hand = cloneValue(playerDto.hand);
    concretePlayer.playedMissions = cloneValue(playerDto.playedMissions);
    concretePlayer.completedMissions = cloneValue(playerDto.completedMissions);
    concretePlayer.endGameCards = cloneValue(playerDto.endGameCards);
    concretePlayer.tuckedIncomeCards = cloneValue(playerDto.tuckedIncomeCards);
    concretePlayer.techs = [...playerDto.techs];
    concretePlayer.traces = cloneValue(playerDto.traces);
    concretePlayer.tracesByAlien = cloneValue(playerDto.tracesByAlien ?? {});
    concretePlayer.waitingFor = undefined;

    const playerInternal = concretePlayer as unknown as IPlayerInternalState;
    playerInternal.moveStashCount = playerDto.moveStashCount;
    playerInternal.pendingCardDrawCount = playerDto.pendingCardDrawCount;
    playerInternal.pendingAnyCardDrawCount = playerDto.pendingAnyCardDrawCount;
  }
}

function deserializeMilestones(game: Game, dto: IGameStateDto): void {
  game.neutralMilestones = [...dto.milestones.neutralMilestoneThresholds];
  game.milestoneState = new MilestoneState(
    dto.milestones.neutralMilestoneThresholds,
    dto.milestones.neutralDiscoveryMarkersCapacity,
  );
  const milestoneInternal =
    game.milestoneState as unknown as IMilestoneInternalState;
  milestoneInternal.goldMilestones = dto.milestones.goldMilestones.map(
    (milestone) => ({
      threshold: milestone.threshold,
      resolvedPlayerIds: new Set(milestone.resolvedPlayerIds),
    }),
  );
  milestoneInternal.neutralMilestones = dto.milestones.neutralMilestones.map(
    (milestone) => ({
      threshold: milestone.threshold,
      markersRemaining: milestone.markersRemaining,
      resolvedPlayerIds: new Set(milestone.resolvedPlayerIds),
    }),
  );
  milestoneInternal.neutralDiscoveryMarkersUsed =
    dto.milestones.neutralDiscoveryMarkersUsed;
}

function deserializeGoldTiles(game: Game, dto: IGameStateDto): void {
  game.goldScoringTiles = dto.goldScoringTiles.map((tileDto) => {
    const tile = new GoldScoringTile({
      id: tileDto.id,
      side: tileDto.side,
      slotValues: tileDto.slotValues,
    });
    const claims = tile.claims as Array<{ playerId: string; value: number }>;
    claims.splice(
      0,
      claims.length,
      ...tileDto.claims.map((claim) => ({ ...claim })),
    );
    return tile;
  });
}

function deserializeMissionTracker(game: Game, dto: IGameStateDto): void {
  game.missionTracker = new MissionTracker();
  const missionInternal =
    game.missionTracker as unknown as IMissionTrackerInternalState;
  missionInternal.missionsByPlayer = new Map(
    dto.missionTracker.missionsByPlayer.map((entry) => [
      entry.playerId,
      cloneValue(entry.missions),
    ]),
  );
  missionInternal.eventBuffer = cloneValue(dto.missionTracker.eventBuffer);
}

export function deserializeGame(dto: IGameStateDto): Game {
  const identities = dto.players.map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    seatIndex: player.seatIndex,
  }));

  const game = Game.create(identities, dto.options, dto.seed, dto.gameId);
  game.random.setState(dto.rngState);

  game.round = dto.round;
  game.phase = dto.phase;
  game.roundRotationReminderIndex = dto.roundRotationReminderIndex;
  game.hasRoundFirstPassOccurred = dto.hasRoundFirstPassOccurred;

  const startPlayer = game.players.find(
    (player) => player.id === dto.startPlayerId,
  );
  const activePlayer = game.players.find(
    (player) => player.id === dto.currentPlayerId,
  );
  if (!startPlayer || !activePlayer) {
    throw new Error('Could not resolve start/active player from snapshot');
  }
  game.startPlayer = startPlayer;
  game.activePlayer = activePlayer;

  game.solarSystem = deserializeSolarSystem(dto);
  game.rotationCounter = dto.rotationCounter;
  game.solarSystemSetup = dto.solarSystemSetup
    ? cloneValue(dto.solarSystemSetup)
    : null;
  game.planetaryBoard = deserializePlanetaryBoard(dto);
  game.techBoard = deserializeTechBoard(dto);
  game.sectors = deserializeSectors(dto);

  game.mainDeck = new Deck(dto.mainDeck.drawPile, dto.mainDeck.discardPile);
  game.cardRow = cloneValue(dto.cardRow);
  game.endOfRoundStacks = cloneValue(dto.endOfRoundStacks);
  game.hiddenAliens = dto.alienState.aliens.map((a) => a.alienType);
  game.alienState = new AlienState({
    aliens: dto.alienState.aliens.map((a) => ({
      alienType: a.alienType,
      alienIndex: a.alienIndex,
      discovered: a.discovered,
      slots: a.slots.map((s) => ({
        slotId: s.slotId,
        alienIndex: s.alienIndex,
        traceColor: s.traceColor,
        occupants: s.occupants.map((occ) => ({
          source: occ.source,
          traceColor: occ.traceColor,
        })),
        maxOccupants: s.maxOccupants,
        rewards: s.rewards.map((r) => ({ ...r })),
        isDiscovery: s.isDiscovery,
      })),
    })),
  });

  deserializePlayers(game, dto);

  game.eventLog = new EventLog();
  for (const event of dto.eventLog) {
    game.eventLog.append(cloneValue(event));
  }

  deserializeMilestones(game, dto);
  deserializeGoldTiles(game, dto);
  deserializeMissionTracker(game, dto);

  game.deferredActions = new DeferredActionsQueue();
  return game;
}
