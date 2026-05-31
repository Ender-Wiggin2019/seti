import { normalizeRivalBoardConfigId } from '@seti/common/constant/solo';
import { DEFAULT_COLUMN_CONFIGS } from '@seti/common/types/computer';
import { type EPlanet } from '@seti/common/types/protocol/enums';
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
import { TuckCardForIncomeEffect } from '@/engine/effects/income/TuckCardForIncomeEffect.js';
import { EventLog } from '@/engine/event/EventLog.js';
import { Game } from '@/engine/Game.js';
import { GameSetup } from '@/engine/GameSetup.js';
import type {
  IMissionEvent,
  IMissionRuntimeState,
} from '@/engine/missions/IMission.js';
import { MissionTracker } from '@/engine/missions/MissionTracker.js';
import { OrganizationRegistry } from '@/engine/organization/OrganizationRegistry.js';
import { Computer } from '@/engine/player/Computer.js';
import type { ComputerColumn } from '@/engine/player/ComputerColumn.js';
import { DataPool } from '@/engine/player/DataPool.js';
import { Income } from '@/engine/player/Income.js';
import { Pieces } from '@/engine/player/Pieces.js';
import { Player } from '@/engine/player/Player.js';
import { Resources } from '@/engine/player/Resources.js';
import { GoldScoringTile } from '@/engine/scoring/GoldScoringTile.js';
import { MilestoneState } from '@/engine/scoring/Milestone.js';
import { SetupChoiceCoordinator } from '@/engine/setup/SetupChoiceCoordinator.js';
import { RivalState } from '@/engine/solo/RivalState.js';
import { type ITechStack, TechBoard } from '@/engine/tech/TechBoard.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import type { IGameStateDto, ITraceSlotDto } from '../dto/GameStateDto.js';

interface ITechBoardInternalState {
  playerTechs: Map<string, Set<string>>;
}

interface ISectorInternalState {
  nextDataTokenId: number;
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

function requireGameCounter<TValue>(
  value: TValue | undefined,
  name: string,
): TValue {
  if (value === undefined) {
    throw new Error(`Missing required game counter: ${name}`);
  }
  return value;
}

function requirePlayerSnapshotField<TValue>(
  value: TValue | undefined,
  name: string,
): TValue {
  if (value === undefined) {
    throw new Error(`Missing required player snapshot field: ${name}`);
  }
  return value;
}

function replayPendingResolution(dto: IGameStateDto): Game | undefined {
  const journal = dto.pendingResolution;
  if (!journal) {
    return undefined;
  }
  if (journal.version !== 1) {
    throw new Error(
      `Unsupported pending resolution journal ${journal.version}`,
    );
  }

  const baseState = cloneValue(journal.baseState);
  delete baseState.pendingResolution;
  const game = deserializeGame(baseState);

  for (const step of journal.steps) {
    switch (step.type) {
      case 'MAIN_ACTION':
        game.processMainAction(step.playerId, step.action);
        break;
      case 'FREE_ACTION':
        game.processFreeAction(step.playerId, step.action);
        break;
      case 'INPUT_RESPONSE':
        game.processInput(step.playerId, step.response);
        break;
      default: {
        const exhaustive: never = step;
        return exhaustive;
      }
    }
  }

  game.pendingResolutionJournal = cloneValue(journal);
  return game;
}

function deserializeTraceSlotDto(slot: ITraceSlotDto): {
  slotId: string;
  alienIndex: number;
  traceColor: ITraceSlotDto['traceColor'];
  occupants: ITraceSlotDto['occupants'];
  maxOccupants: number;
  rewards: ITraceSlotDto['rewards'];
  isDiscovery: boolean;
} {
  return {
    slotId: slot.slotId,
    alienIndex: slot.alienIndex,
    traceColor: slot.traceColor,
    occupants: slot.occupants.map((occ) => ({
      source: occ.source,
      traceColor: occ.traceColor,
    })),
    maxOccupants: slot.maxOccupants,
    rewards: slot.rewards.map((reward) => ({ ...reward })),
    isDiscovery: slot.isDiscovery,
  };
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
    publicityIconAmount: space.publicityIconAmount,
    elements: space.elements.map((element) => ({
      ...element,
      type: element.type as never,
    })),
    layers: space.layers.map((layer) => ({
      discIndex: layer.discIndex,
      element: {
        ...layer.element,
        type: layer.element.type as never,
      },
      hasPublicityIcon: layer.hasPublicityIcon,
      publicityIconAmount: layer.publicityIconAmount,
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

  for (const token of dto.solarSystem.alienTokens) {
    solarSystem.addAlienToken({
      tokenId: token.tokenId,
      alienType: token.alienType,
      sectorIndex: token.sectorIndex,
      traceColor: token.traceColor,
      rewards: token.rewards.map((reward) => ({ ...reward })),
    });
  }

  return solarSystem;
}

function deserializePlanetaryBoard(dto: IGameStateDto): PlanetaryBoard | null {
  if (!dto.planetaryBoard) {
    return null;
  }

  const board = new PlanetaryBoard();
  board.planets.clear();
  for (const entry of dto.planetaryBoard.planets) {
    const state = cloneValue(entry.state) as Omit<
      IPlanetState,
      'moonOccupants'
    > & {
      moonOccupants: Array<{
        playerId: string;
        moonId?: string;
      }>;
    };
    if (!Array.isArray(state.moonOccupants)) {
      throw new Error(`Missing moonOccupants for saved planet ${entry.planet}`);
    }
    const moonOccupants = state.moonOccupants.map((slot) => {
      if (typeof slot.moonId !== 'string' || slot.moonId.length === 0) {
        throw new Error(
          `Missing moonId for saved moon occupant on ${entry.planet}`,
        );
      }
      return {
        playerId: slot.playerId,
        moonId: slot.moonId,
      };
    });
    board.planets.set(entry.planet, { ...state, moonOccupants });
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
      tiles: stackDto.tiles.map((tileDto, index) => {
        if (!Array.isArray(tileDto.bonuses)) {
          throw new Error('Missing bonuses for saved tech tile');
        }
        return {
          tech: sourceStack.tiles[index % sourceStack.tiles.length].tech,
          bonus: tileDto.bonuses[0],
          bonuses: [...tileDto.bonuses],
        };
      }),
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
      name: sectorDto.name,
      color: sectorDto.color,
      dataSlotCapacity: sectorDto.dataSlotCapacity,
      firstWinBonus: sectorDto.firstWinBonus,
      repeatWinBonus: sectorDto.repeatWinBonus,
    });

    sector.signals = sectorDto.signals.map((s) => ({ ...s }) as never);
    sector.sectorWinners = [...sectorDto.sectorWinners];
    sector.completed = sectorDto.completed;

    const internal = sector as unknown as ISectorInternalState;
    internal.nextDataTokenId = sectorDto.nextDataTokenId;
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
    player.pendingSetupTucks = Math.max(0, playerDto.pendingSetupTucks);
    player.setupChoiceContext = playerDto.setupChoiceContext
      ? cloneValue(playerDto.setupChoiceContext)
      : undefined;
    player.quickStartCardIds = [
      ...requirePlayerSnapshotField(
        playerDto.quickStartCardIds,
        'quickStartCardIds',
      ),
    ];
    player.organizationIds = [
      ...requirePlayerSnapshotField(
        playerDto.organizationIds,
        'organizationIds',
      ),
    ];
    player.organizationState = cloneValue(
      requirePlayerSnapshotField(
        playerDto.organizationState,
        'organizationState',
      ),
    );
    player.oncePerRoundUsed = cloneValue(
      requirePlayerSnapshotField(
        playerDto.oncePerRoundUsed,
        'oncePerRoundUsed',
      ),
    );
    player.actionCosts = cloneValue(
      requirePlayerSnapshotField(playerDto.actionCosts, 'actionCosts'),
    );
    player.exofossils = Math.max(
      0,
      requirePlayerSnapshotField(playerDto.exofossils, 'exofossils'),
    );

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
      const col = computerInternal.columns[
        i
      ] as unknown as IComputerColumnInternal;
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
        signalTokens: requirePlayerSnapshotField(
          playerDto.resources.signalTokens,
          'resources.signalTokens',
        ),
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
    concretePlayer.playedCards = cloneValue(
      requirePlayerSnapshotField(playerDto.playedCards, 'playedCards'),
    );
    concretePlayer.completedMissions = cloneValue(playerDto.completedMissions);
    concretePlayer.endGameCards = cloneValue(playerDto.endGameCards);
    concretePlayer.tuckedIncomeCards = cloneValue(playerDto.tuckedIncomeCards);
    concretePlayer.techs = [...playerDto.techs];
    concretePlayer.traces = cloneValue(playerDto.traces);
    concretePlayer.tracesByAlien = cloneValue(
      requirePlayerSnapshotField(playerDto.tracesByAlien, 'tracesByAlien'),
    );
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

function deserializeRivalState(game: Game, dto: IGameStateDto): void {
  if (!dto.rivalState) {
    game.rivalState = undefined;
    return;
  }

  game.rivalState = new RivalState({
    rivalPlayerId: dto.rivalState.rivalPlayerId,
    difficulty: dto.rivalState.difficulty,
    progress: dto.rivalState.progress,
    progressSlot: dto.rivalState.progressSlot,
    boardConfigId: normalizeRivalBoardConfigId(dto.rivalState.boardConfigId),
    actionDeck: dto.rivalState.actionDeck.drawPile,
    actionDiscardPile: dto.rivalState.actionDeck.discardPile,
    advancedReserve: dto.rivalState.advancedReserve,
    removedActionCardIds: dto.rivalState.removedActionCardIds,
    usedActionCardIdsThisRound: dto.rivalState.usedActionCardIdsThisRound,
    computer: {
      filledSlots: [...dto.rivalState.computer.filledSlots],
      dataPool: dto.rivalState.computer.dataPool,
    },
    objectiveDrawPile: dto.rivalState.objectiveDrawPile,
    revealedObjectiveIds: dto.rivalState.revealedObjectiveIds,
    completedObjectiveIds: dto.rivalState.completedObjectiveIds,
    objectiveTaskMarkers: dto.rivalState.objectiveTaskMarkers,
    currentActionCardId: dto.rivalState.currentActionCardId,
  });
}

export function deserializeGame(dto: IGameStateDto): Game {
  const replayed = replayPendingResolution(dto);
  if (replayed) {
    return replayed;
  }

  const identities = dto.players.map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    seatIndex: player.seatIndex,
  }));

  const game = Game.create(identities, dto.options, dto.seed, dto.gameId);
  game.random.setState(dto.rngState);

  game.round = dto.round;
  game.roundIndex = requireGameCounter(dto.roundIndex, 'roundIndex');
  game.maxRounds = requireGameCounter(dto.maxRounds, 'maxRounds');
  game.phase = dto.phase;
  game.roundRotationReminderIndex = dto.roundRotationReminderIndex;
  game.hasRoundFirstPassOccurred = dto.hasRoundFirstPassOccurred;
  game.turnIndex = requireGameCounter(dto.turnIndex, 'turnIndex');
  game.turnLocked = requireGameCounter(dto.turnLocked, 'turnLocked');

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
      alienDeckDrawPile: [...(a.alienDeckDrawPile ?? [])],
      alienDeckDiscardPile: [...(a.alienDeckDiscardPile ?? [])],
      faceUpAlienCardId: a.faceUpAlienCardId ?? null,
      oumuamuaTile: a.oumuamuaTile
        ? {
            ...a.oumuamuaTile,
            markerPlayerIds: [...a.oumuamuaTile.markerPlayerIds],
          }
        : null,
      mascamitesSamplePools: a.mascamitesSamplePools
        ? {
            jupiter: [...a.mascamitesSamplePools.jupiter],
            saturn: [...a.mascamitesSamplePools.saturn],
          }
        : undefined,
      mascamitesPublicSamples: [...(a.mascamitesPublicSamples ?? [])],
      mascamitesCapsules: a.mascamitesCapsules?.map((capsule) => ({
        ...capsule,
      })),
      mascamitesDeliveredSamples: a.mascamitesDeliveredSamples?.map(
        (sample) => ({ ...sample }),
      ),
      exertiansFaceDownCards: a.exertiansFaceDownCards?.map((card) => ({
        ...card,
      })),
      exertiansMilestones: a.exertiansMilestones?.map((milestone) => ({
        ...milestone,
        claimedByPlayerIds: [...milestone.claimedByPlayerIds],
      })),
      centauriansMessageMilestones: a.centauriansMessageMilestones?.map(
        (milestone) => ({ ...milestone }),
      ),
      centauriansPendingMessagesByPlayer: Object.fromEntries(
        Object.entries(a.centauriansPendingMessagesByPlayer ?? {}).map(
          ([playerId, cardIds]) => [playerId, [...cardIds]],
        ),
      ),
      centauriansRewardSlots: a.centauriansRewardSlots?.map((slot) => ({
        ...slot,
        rewards: slot.rewards.map((reward) => ({ ...reward })),
      })),
      glyphidsGlyphTokenBank: [...(a.glyphidsGlyphTokenBank ?? [])],
      glyphidsGlyphRows: cloneValue(a.glyphidsGlyphRows ?? {}),
      glyphidsBoardTokens: a.glyphidsBoardTokens?.map((token) => ({
        ...token,
      })),
      glyphidsPlacedTokens: a.glyphidsPlacedTokens?.map((token) => ({
        tokenId: token.tokenId,
        glyph: token.glyph,
        location: { ...token.location },
      })),
      glyphidsTranslationRows: a.glyphidsTranslationRows?.map((row) => ({
        ...row,
        glyphs: [...row.glyphs],
      })),
      amoebaOrganelles: a.amoebaOrganelles?.map((token) => ({ ...token })),
      arkhosExplorationDrawPile: [...(a.arkhosExplorationDrawPile ?? [])],
      arkhosExplorationReservePile: [...(a.arkhosExplorationReservePile ?? [])],
      arkhosExplorationDiscardPile: [...(a.arkhosExplorationDiscardPile ?? [])],
      arkhosSecurityCardsByPlayer: cloneValue(
        a.arkhosSecurityCardsByPlayer ?? {},
      ),
      arkhosAccessByPlayer: cloneValue(a.arkhosAccessByPlayer ?? {}),
      arkhosResolvedExplorationRewards: (
        a.arkhosResolvedExplorationRewards ?? []
      ).map((reward) => ({ ...reward })),
      discoverySlots: a.discoverySlots.map((slot) =>
        deserializeTraceSlotDto(slot),
      ),
      overflowSlots: a.overflowSlots.map((slot) =>
        deserializeTraceSlotDto(slot),
      ),
      speciesTraceSlots: a.speciesTraceSlots.map((slot) =>
        deserializeTraceSlotDto(slot),
      ),
      anomalyColumns: a.anomalyColumns?.map((slot) =>
        deserializeTraceSlotDto(slot),
      ),
    })),
  });

  deserializePlayers(game, dto);
  OrganizationRegistry.restorePlayerOrganizations(game);

  game.eventLog = new EventLog();
  for (const event of dto.eventLog) {
    game.eventLog.append(cloneValue(event));
  }

  deserializeMilestones(game, dto);
  deserializeGoldTiles(game, dto);
  deserializeMissionTracker(game, dto);
  deserializeRivalState(game, dto);
  game.finalScoringResult = dto.finalScoringResult
    ? cloneValue(dto.finalScoringResult)
    : undefined;

  game.deferredActions = new DeferredActionsQueue();

  rehydratePendingInputs(game);

  return game;
}

/**
 * Pending inputs (`player.waitingFor`) are intentionally not persisted:
 * they contain closures. For deterministic inputs whose shape is fully
 * implied by explicit player state, we reconstruct them here so that
 * any path that goes through deserialize (DB cold-load, undo rollback,
 * tests) yields a fully playable game state.
 *
 * Currently only the setup-tuck chain qualifies — see
 * {@link TuckCardForIncomeEffect.executeSetupChain} and
 * `IPlayer.pendingSetupTucks`. Add additional resumable inputs here as
 * they are introduced.
 */
function rehydratePendingInputs(game: Game): void {
  const setupChoicePlayers = game.players.filter(
    (player) => player.setupChoiceContext !== undefined,
  );

  for (const player of game.players) {
    if (player.waitingFor) continue;
    if (player.pendingSetupTucks > 0) {
      player.waitingFor = TuckCardForIncomeEffect.executeSetupChain(
        player,
        game,
      );
      continue;
    }
    const setupChoiceInput = SetupChoiceCoordinator.rehydratePendingInput(
      player,
      setupChoicePlayers,
      () => GameSetup.resolveSetupChoiceSelections(game),
    );
    if (setupChoiceInput) {
      player.waitingFor = setupChoiceInput;
    }
  }
}
