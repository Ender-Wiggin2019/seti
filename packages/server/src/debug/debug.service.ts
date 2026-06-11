import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ETrace } from '@seti/common/types/element';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import type {
  IDebugReplayPresetDefinition,
  IDebugReplaySessionRequest,
  IDebugReplaySessionResponse,
  IDebugServerSessionResponse,
  IDebugSnapshotSessionRequest,
  IDebugSnapshotSessionResponse,
} from '@seti/common/types/protocol/debug';
import {
  EAlienType,
  EFreeAction,
  EMainAction,
  EPhase,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import {
  EPlayerInputType,
  type IPlayerInputModel,
} from '@seti/common/types/protocol/playerInput';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { IJwtPayload } from '@/auth/jwt-auth.guard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { Game } from '@/engine/Game.js';
import { createGameOptions, EExpansion } from '@/engine/GameOptions.js';
import type { IGame, IGamePlayerIdentity } from '@/engine/IGame.js';
import { GameManager } from '@/gateway/GameManager.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import type { IGameStateDto } from '@/persistence/dto/GameStateDto.js';
import { GameRepository } from '@/persistence/repository/GameRepository.js';
import { TurnSnapshotRepository } from '@/persistence/repository/TurnSnapshotRepository.js';
import { deserializeGame } from '@/persistence/serializer/GameDeserializer.js';
import { GameError } from '@/shared/errors/GameError.js';
import {
  applyBehaviorFlowScenario,
  BEHAVIOR_FLOW_SEED,
} from '@/testing/behaviorFlowScenario.js';
import { DebugSessionRegistry } from './DebugSessionRegistry.js';
import {
  applyDebugReplayPreset,
  listDebugReplayPresets,
} from './debugReplayPresets.js';

interface IDebugAuthUser {
  id: string;
  name: string;
  email: string;
}

export interface IDebugBehaviorFlowSessionResponse {
  gameId: string;
  seed: string;
  players: Array<{
    accessToken: string;
    user: IDebugAuthUser;
  }>;
}

// Debug seed players use the rulebook palette (green/orange/purple/
// white) so the renderer paints probes, markers, and tokens in the
// retail piece colors rather than placeholder red/blue.
const DEBUG_PLAYER_BLUEPRINTS: ReadonlyArray<{
  name: string;
  color: string;
}> = [
  { name: 'Commander Ada', color: 'green' },
  { name: 'Bot Vega', color: 'orange' },
];

const BEHAVIOR_FLOW_PLAYER_BLUEPRINTS: ReadonlyArray<{
  name: string;
  color: string;
}> = [
  { name: 'Alice', color: 'green' },
  { name: 'Bob', color: 'orange' },
];

const DEBUG_BOT_MAIN_ACTIONS: ReadonlyArray<EMainAction> = [
  EMainAction.LAUNCH_PROBE,
  EMainAction.RESEARCH_TECH,
  EMainAction.LAND,
  EMainAction.SCAN,
  EMainAction.ORBIT,
  EMainAction.PASS,
];
const MAX_DEBUG_BOT_STEPS = 20;
const DEBUG_REVEAL_ALIEN_TYPES = new Set<EAlienType>([
  EAlienType.OUMUAMUA,
  EAlienType.ANOMALIES,
  EAlienType.MASCAMITES,
  EAlienType.GLYPHIDS,
]);

@Injectable()
export class DebugService {
  private readonly logger = new Logger(DebugService.name);
  private readonly gameRepository: GameRepository;
  private readonly turnSnapshotRepository: TurnSnapshotRepository;

  constructor(
    @Inject(DRIZZLE_DB) db: NodePgDatabase,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(GameManager) private readonly gameManager: GameManager,
    @Inject(DebugSessionRegistry)
    private readonly debugSessionRegistry: DebugSessionRegistry,
  ) {
    this.gameRepository = new GameRepository(db);
    this.turnSnapshotRepository = new TurnSnapshotRepository(db);
  }

  private createAuthSession(user: IDebugAuthUser): {
    accessToken: string;
    user: IDebugAuthUser;
  } {
    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '2h' }),
      user,
    };
  }

  async createServerSession(): Promise<IDebugServerSessionResponse> {
    const gameId = randomUUID();
    const seed = randomUUID();
    const playerCount = DEBUG_PLAYER_BLUEPRINTS.length;
    const players: IGamePlayerIdentity[] = DEBUG_PLAYER_BLUEPRINTS.map(
      (blueprint, seatIndex) => ({
        id: randomUUID(),
        name: blueprint.name,
        color: blueprint.color,
        seatIndex,
      }),
    );

    const gameOptions = createGameOptions({ playerCount });
    const game = Game.create(players, gameOptions, seed, gameId);
    const humanPlayer = players[0];
    const botPlayerIds = players.slice(1).map((player) => player.id);
    this.debugSessionRegistry.register(gameId, humanPlayer.id, botPlayerIds);
    this.resolveDebugBotPendingInputsInMemory(game, botPlayerIds);
    this.gameManager.registerGame(game);
    try {
      await this.gameRepository.create(game);
    } catch (error) {
      this.logger.warn(
        `Failed to persist debug game ${gameId}, continuing with in-memory mode`,
      );
      this.logger.debug(error);
    }

    const viewerEmail = `${humanPlayer.id}@debug.local`;
    const session = this.createAuthSession({
      id: humanPlayer.id,
      name: humanPlayer.name,
      email: viewerEmail,
    });

    return {
      gameId,
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  async createBehaviorFlowSession(): Promise<IDebugBehaviorFlowSessionResponse> {
    const gameId = randomUUID();
    const players: IGamePlayerIdentity[] = BEHAVIOR_FLOW_PLAYER_BLUEPRINTS.map(
      (blueprint, seatIndex) => ({
        id: randomUUID(),
        name: blueprint.name,
        color: blueprint.color,
        seatIndex,
      }),
    );

    const game = Game.create(
      players,
      createGameOptions({ playerCount: 2 }),
      BEHAVIOR_FLOW_SEED,
      gameId,
    );

    applyBehaviorFlowScenario(game);

    this.gameManager.registerGame(game);
    try {
      await this.gameRepository.create(game);
    } catch (error) {
      this.logger.warn(
        `Failed to persist behavior-flow game ${gameId}, continuing with in-memory mode`,
      );
      this.logger.debug(error);
    }

    return {
      gameId,
      seed: BEHAVIOR_FLOW_SEED,
      players: players.map((player) =>
        this.createAuthSession({
          id: player.id,
          name: player.name,
          email: `${player.id}@debug.local`,
        }),
      ),
    };
  }

  listReplayPresets(): IDebugReplayPresetDefinition[] {
    return listDebugReplayPresets();
  }

  async createReplaySession(
    request: IDebugReplaySessionRequest,
  ): Promise<IDebugReplaySessionResponse> {
    const gameId = randomUUID();
    const seed = randomUUID();
    const playerCount = DEBUG_PLAYER_BLUEPRINTS.length;
    const players: IGamePlayerIdentity[] = DEBUG_PLAYER_BLUEPRINTS.map(
      (blueprint, seatIndex) => ({
        id: randomUUID(),
        name: blueprint.name,
        color: blueprint.color,
        seatIndex,
      }),
    );

    const gameOptions = createGameOptions(
      this.getReplaySessionGameOptions(request, playerCount),
    );
    const game = Game.create(players, gameOptions, seed, gameId);
    const replay = this.applyReplayPreset(game, request);

    const humanPlayer =
      players.find((player) => player.id === replay.currentPlayerId) ??
      players[0];
    const botPlayerIds = players
      .filter((player) => player.id !== humanPlayer.id)
      .map((player) => player.id);

    this.debugSessionRegistry.register(gameId, humanPlayer.id, botPlayerIds);
    this.gameManager.registerGame(game);
    try {
      await this.gameRepository.create(game);
    } catch (error) {
      this.logger.warn(
        `Failed to persist replay debug game ${gameId}, continuing with in-memory mode`,
      );
      this.logger.debug(error);
    }

    const session = this.createAuthSession({
      id: humanPlayer.id,
      name: humanPlayer.name,
      email: `${humanPlayer.id}@debug.local`,
    });

    return {
      gameId,
      accessToken: session.accessToken,
      user: session.user,
      replay,
    };
  }

  async createSnapshotSession(
    request: IDebugSnapshotSessionRequest,
  ): Promise<IDebugSnapshotSessionResponse> {
    this.assertSnapshotReplayAllowed();

    const snapshotRecord =
      request.version !== undefined
        ? await this.turnSnapshotRepository.loadByTurn(
            request.gameId,
            request.version,
          )
        : await this.turnSnapshotRepository.loadLatest(request.gameId);
    const snapshot = snapshotRecord?.state;

    if (!snapshot) {
      throw new GameError(
        EErrorCode.GAME_NOT_FOUND,
        `No snapshot found for game ${request.gameId}${request.version !== undefined ? ` version ${request.version}` : ''}`,
      );
    }

    this.assertSnapshotReplayResumable(snapshot);

    const sourceGameId = snapshot.gameId;
    const snapshotVersion = snapshot.version;
    const replaySnapshot: IGameStateDto = {
      ...snapshot,
      gameId: randomUUID(),
    };

    const game = deserializeGame(replaySnapshot);

    const humanPlayer =
      request.viewerPlayerId !== undefined
        ? game.players.find((player) => player.id === request.viewerPlayerId)
        : game.activePlayer;
    if (!humanPlayer) {
      throw new GameError(
        EErrorCode.PLAYER_NOT_FOUND,
        `Viewer player ${request.viewerPlayerId} not found in snapshot ${sourceGameId}`,
        { sourceGameId, viewerPlayerId: request.viewerPlayerId },
      );
    }
    const botPlayerIds = game.players
      .filter((player) => player.id !== humanPlayer.id)
      .map((player) => player.id);

    try {
      await this.gameRepository.create(game);
    } catch (error) {
      this.logger.warn(
        `Failed to persist snapshot replay game ${game.id}, continuing with in-memory mode`,
      );
      this.logger.debug(error);
    }

    this.debugSessionRegistry.register(game.id, humanPlayer.id, botPlayerIds);
    this.gameManager.registerGame(game);

    const session = this.createAuthSession({
      id: humanPlayer.id,
      name: humanPlayer.name,
      email: `${humanPlayer.id}@debug.local`,
    });

    return {
      gameId: game.id,
      accessToken: session.accessToken,
      user: session.user,
      sourceGameId,
      snapshotVersion,
      phase: game.phase,
      round: game.round,
    };
  }

  private applyReplayPreset(game: Game, request: IDebugReplaySessionRequest) {
    try {
      return applyDebugReplayPreset(game, request);
    } catch (error) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        error instanceof Error
          ? error.message
          : 'Invalid replay preset request',
      );
    }
  }

  private getReplaySessionGameOptions(
    request: IDebugReplaySessionRequest,
    playerCount: number,
  ): Parameters<typeof createGameOptions>[0] {
    if (
      request.presetId === 'free-action-debug' &&
      request.checkpointId === 'spend-signal-token'
    ) {
      return {
        playerCount,
        expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
        spaceAgencyOptions: {
          enabled: true,
          agencies: false,
          startResourceCards: false,
          newDeck: true,
          newAlienSpecies: false,
        },
      };
    }

    return { playerCount };
  }

  private assertSnapshotReplayAllowed(): void {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.SETI_ENABLE_DEBUG_SNAPSHOT_REPLAY !== 'true'
    ) {
      throw new GameError(
        EErrorCode.FORBIDDEN,
        'Snapshot replay is disabled in production',
      );
    }
  }

  private assertSnapshotReplayResumable(snapshot: IGameStateDto): void {
    const resumablePhases = new Set<EPhase>([
      EPhase.SETUP,
      EPhase.AWAIT_MAIN_ACTION,
      EPhase.AWAIT_END_TURN,
      EPhase.END_OF_ROUND,
      EPhase.FINAL_SCORING,
      EPhase.GAME_OVER,
    ]);

    if (resumablePhases.has(snapshot.phase)) {
      return;
    }

    throw new GameError(
      EErrorCode.INVALID_PHASE,
      `Snapshot ${snapshot.gameId} version ${snapshot.version} is in ${snapshot.phase} and cannot be replayed safely`,
      {
        gameId: snapshot.gameId,
        version: snapshot.version,
        phase: snapshot.phase,
      },
    );
  }

  async getProjectedState(
    gameId: string,
    viewerId: string,
  ): Promise<IPublicGameState> {
    await this.gameManager.getGame(gameId);
    const state = this.gameManager.getProjectedState(gameId, viewerId);
    if (!state) {
      throw new Error(`No projected state for game ${gameId}`);
    }
    return state;
  }

  async processMainAction(
    gameId: string,
    playerId: string,
    action: IMainActionRequest,
    viewerId: string,
  ): Promise<IPublicGameState> {
    await this.resolveDebugBotPendingInputs(gameId);
    await this.gameManager.processAction(gameId, playerId, action);
    await this.runDebugBots(gameId);
    return this.getProjectedState(gameId, viewerId);
  }

  async processFreeAction(
    gameId: string,
    playerId: string,
    action: IFreeActionRequest,
    viewerId: string,
  ): Promise<IPublicGameState> {
    await this.resolveDebugBotPendingInputs(gameId);
    await this.gameManager.processFreeAction(gameId, playerId, action);
    await this.runDebugBots(gameId);
    return this.getProjectedState(gameId, viewerId);
  }

  async processEndTurn(
    gameId: string,
    playerId: string,
    viewerId: string,
  ): Promise<IPublicGameState> {
    await this.gameManager.processEndTurn(gameId, playerId);
    await this.runDebugBots(gameId);
    return this.getProjectedState(gameId, viewerId);
  }

  async processInput(
    gameId: string,
    playerId: string,
    inputResponse: IInputResponse,
    viewerId: string,
  ): Promise<IPublicGameState> {
    await this.gameManager.processInput(gameId, playerId, inputResponse);
    await this.resolveDebugBotPendingInputs(gameId);
    await this.runDebugBots(gameId);
    return this.getProjectedState(gameId, viewerId);
  }

  async getPendingInput(
    gameId: string,
    playerId: string,
  ): Promise<IPlayerInputModel | null> {
    const game = await this.gameManager.getGame(gameId);
    const player = game.players.find((entry) => entry.id === playerId);
    if (!player?.waitingFor) {
      return null;
    }
    return player.waitingFor.toModel();
  }

  // ── Solar-system sandbox ────────────────────────────────────────────────
  // These endpoints mutate the live SolarSystem directly so UI debuggers can
  // exercise data-driven view paths (disc rotation, probe placement/moves)
  // without going through the full action-validation pipeline.

  async solarRotate(
    gameId: string,
    discIndex: number,
    viewerId: string,
  ): Promise<IPublicGameState> {
    const game = await this.gameManager.getGame(gameId);
    const solarSystem = game.solarSystem;
    if (!solarSystem) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Solar system not initialized',
      );
    }
    solarSystem.rotate(discIndex);
    game.alienState?.onSolarSystemRotated(game);
    return this.getProjectedState(gameId, viewerId);
  }

  async solarRotateNext(
    gameId: string,
    viewerId: string,
  ): Promise<IPublicGameState> {
    const game = await this.gameManager.getGame(gameId);
    const solarSystem = game.solarSystem;
    if (!solarSystem) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Solar system not initialized',
      );
    }
    solarSystem.rotateNextDisc();
    game.alienState?.onSolarSystemRotated(game);
    return this.getProjectedState(gameId, viewerId);
  }

  async placeProbeDirect(
    gameId: string,
    playerId: string,
    spaceId: string,
    viewerId: string,
  ): Promise<IPublicGameState> {
    const game = await this.gameManager.getGame(gameId);
    const solarSystem = game.solarSystem;
    if (!solarSystem) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Solar system not initialized',
      );
    }
    solarSystem.placeProbe(playerId, spaceId);
    return this.getProjectedState(gameId, viewerId);
  }

  async moveProbeDirect(
    gameId: string,
    probeId: string,
    toSpaceId: string,
    viewerId: string,
  ): Promise<IPublicGameState> {
    const game = await this.gameManager.getGame(gameId);
    const solarSystem = game.solarSystem;
    if (!solarSystem) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Solar system not initialized',
      );
    }
    const probe = solarSystem.findProbe(probeId);
    if (!probe) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        `Probe ${probeId} not found`,
      );
    }
    solarSystem.moveProbe(probeId, probe.space.id, toSpaceId);
    return this.getProjectedState(gameId, viewerId);
  }

  /**
   * Direct debug trace placement that bypasses the action pipeline. Useful for
   * testing alien-board UX without setting up the full Scan/Analyze/PlayCard
   * flow needed to actually mark a trace in production. Routes through
   * `Game.markTrace` so plugin hooks (column rewards, neutral propagation,
   * mission events) still fire just like a real placement.
   */
  async placeTraceDirect(
    gameId: string,
    playerId: string,
    traceColor: ETrace,
    viewerId: string,
  ): Promise<IPublicGameState> {
    const game = await this.gameManager.getGame(gameId);
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        `Player ${playerId} not found`,
      );
    }
    const input = game.markTrace(traceColor, playerId);
    if (input !== undefined) {
      player.waitingFor = input;
    }
    return this.getProjectedState(gameId, viewerId);
  }

  async revealAlien(
    gameId: string,
    rawAlienType: EAlienType | string | number,
    viewerId: string,
  ): Promise<IPublicGameState> {
    const alienType = this.normalizeDebugRevealAlienType(rawAlienType);
    const game = await this.gameManager.getGame(gameId);
    const board = this.getOrCreateDebugRevealAlienBoard(game, alienType);

    if (!board.discovered) {
      this.resolveSetupTucksInMemory(game);

      for (const slot of board.getDiscoverySlots()) {
        if (slot.occupants.length > 0) {
          continue;
        }
        board.placeTrace(slot, 'neutral', slot.traceColor);
      }

      const input = game.alienState.discoverAlien(board, game);
      if (input !== undefined) {
        const viewer =
          game.players.find((player) => player.id === viewerId) ??
          game.activePlayer;
        viewer.waitingFor = input;
      }
    }

    return this.getProjectedState(gameId, viewerId);
  }

  private normalizeDebugRevealAlienType(
    rawAlienType: EAlienType | string | number,
  ): EAlienType {
    const alienType = Number(rawAlienType) as EAlienType;
    if (!DEBUG_REVEAL_ALIEN_TYPES.has(alienType)) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        `Unsupported debug reveal alien type: ${rawAlienType}`,
      );
    }
    return alienType;
  }

  private getOrCreateDebugRevealAlienBoard(
    game: IGame,
    alienType: EAlienType,
  ): NonNullable<ReturnType<AlienState['getBoardByType']>> {
    const existingBoard = game.alienState.getBoardByType(alienType);
    if (existingBoard) {
      return existingBoard;
    }

    game.hiddenAliens = [alienType];
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    const board = game.alienState.getBoardByType(alienType);
    if (!board) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        `Alien board not found for debug reveal: ${alienType}`,
      );
    }
    return board;
  }

  private resolveSetupTucksInMemory(game: IGame): void {
    for (const player of game.players) {
      while (player.waitingFor) {
        const model = player.waitingFor.toModel();
        if (model.type !== EPlayerInputType.CARD || model.cards.length === 0) {
          player.waitingFor = undefined;
          player.pendingSetupTucks = 0;
          break;
        }

        game.processInput(player.id, {
          type: EPlayerInputType.CARD,
          cardIds: [model.cards[0].id],
        });
      }
    }
  }

  private async resolveDebugBotPendingInputs(gameId: string): Promise<void> {
    if (!this.debugSessionRegistry.isDebugGame(gameId)) {
      return;
    }

    for (let step = 0; step < MAX_DEBUG_BOT_STEPS; step += 1) {
      const game = await this.gameManager.getGame(gameId);
      let resolvedAny = false;

      for (const player of game.players) {
        if (!this.debugSessionRegistry.isBotPlayer(gameId, player.id)) {
          continue;
        }

        const inputModel = player.waitingFor?.toModel();
        if (!inputModel) {
          continue;
        }

        const response = this.pickRandomInputResponse(inputModel);
        if (!response) {
          continue;
        }

        await this.gameManager.processInput(gameId, player.id, response);
        resolvedAny = true;
      }

      if (!resolvedAny) {
        return;
      }
    }
  }

  private resolveDebugBotPendingInputsInMemory(
    game: Game,
    botPlayerIds: readonly string[],
  ): void {
    const botIdSet = new Set(botPlayerIds);

    for (let step = 0; step < MAX_DEBUG_BOT_STEPS; step += 1) {
      let resolvedAny = false;

      for (const player of game.players) {
        if (!botIdSet.has(player.id)) {
          continue;
        }

        const inputModel = player.waitingFor?.toModel();
        if (!inputModel) {
          continue;
        }

        const response = this.pickRandomInputResponse(inputModel);
        if (!response) {
          continue;
        }

        game.processInput(player.id, response);
        resolvedAny = true;
      }

      if (!resolvedAny) {
        return;
      }
    }
  }

  private async runDebugBots(gameId: string): Promise<void> {
    if (!this.debugSessionRegistry.isDebugGame(gameId)) {
      return;
    }

    for (let step = 0; step < MAX_DEBUG_BOT_STEPS; step += 1) {
      const game = await this.gameManager.getGame(gameId);
      const botPlayerId = game.activePlayer.id;
      if (!this.debugSessionRegistry.isBotPlayer(gameId, botPlayerId)) {
        return;
      }

      const inputModel = game.activePlayer.waitingFor?.toModel();
      if (inputModel) {
        const botResponse = this.pickRandomInputResponse(inputModel);
        if (!botResponse) {
          return;
        }
        await this.gameManager.processInput(gameId, botPlayerId, botResponse);
        continue;
      }

      if (Math.random() < 0.6) {
        await this.tryBotMovement(gameId, botPlayerId);
      }

      const gameAfterMovement = await this.gameManager.getGame(gameId);
      if (gameAfterMovement.phase === EPhase.AWAIT_END_TURN) {
        await this.gameManager.processEndTurn(gameId, botPlayerId);
        continue;
      }

      const executedMainAction = await this.tryBotMainAction(
        gameId,
        botPlayerId,
      );
      if (!executedMainAction) {
        return;
      }
    }
  }

  private async tryBotMovement(
    gameId: string,
    botPlayerId: string,
  ): Promise<boolean> {
    const state = this.gameManager.getProjectedState(gameId, botPlayerId);
    if (!state) {
      return false;
    }

    const botProbes = state.solarSystem.probes.filter(
      (probe) => probe.playerId === botPlayerId && probe.probeId,
    );
    const shuffledProbes = this.shuffle(botProbes);

    for (const probe of shuffledProbes) {
      const fromSpaceId = probe.spaceId;
      const neighbors = this.shuffle(
        state.solarSystem.adjacency[fromSpaceId] ?? [],
      );
      for (const toSpaceId of neighbors) {
        try {
          await this.gameManager.processFreeAction(gameId, botPlayerId, {
            type: EFreeAction.MOVEMENT,
            path: [fromSpaceId, toSpaceId],
            target: { type: 'probe', id: probe.probeId as string },
          });
          return true;
        } catch {
          // Ignore invalid random movement candidate.
        }
      }
    }

    return false;
  }

  private async tryBotMainAction(
    gameId: string,
    botPlayerId: string,
  ): Promise<boolean> {
    const candidateActions = this.shuffle([...DEBUG_BOT_MAIN_ACTIONS]);
    for (const actionType of candidateActions) {
      try {
        await this.gameManager.processAction(gameId, botPlayerId, {
          type: actionType,
        });
        return true;
      } catch {
        // Ignore invalid random main action candidate.
      }
    }
    return false;
  }

  private pickRandomInputResponse(
    model: IPlayerInputModel,
  ): IInputResponse | null {
    switch (model.type) {
      case EPlayerInputType.OPTION: {
        if (model.options.length === 0) {
          return null;
        }
        const option = this.pickRandom(model.options);
        return option
          ? {
              inputId: model.inputId,
              type: EPlayerInputType.OPTION,
              optionId: option.id,
            }
          : null;
      }
      case EPlayerInputType.CARD: {
        const card = this.pickRandom(model.cards);
        if (!card) {
          return null;
        }
        return {
          inputId: model.inputId,
          type: EPlayerInputType.CARD,
          cardIds: [card.id],
        };
      }
      case EPlayerInputType.SECTOR: {
        const sector = this.pickRandom(model.options);
        return sector
          ? { inputId: model.inputId, type: EPlayerInputType.SECTOR, sector }
          : null;
      }
      case EPlayerInputType.PLANET: {
        const planet = this.pickRandom(model.options);
        return planet
          ? { inputId: model.inputId, type: EPlayerInputType.PLANET, planet }
          : null;
      }
      case EPlayerInputType.TECH: {
        const tech = this.pickRandom(model.options);
        return tech
          ? { inputId: model.inputId, type: EPlayerInputType.TECH, tech }
          : null;
      }
      case EPlayerInputType.GOLD_TILE: {
        const tileId = this.pickRandom(model.options);
        return tileId
          ? { inputId: model.inputId, type: EPlayerInputType.GOLD_TILE, tileId }
          : null;
      }
      case EPlayerInputType.RESOURCE: {
        const resource = this.pickRandom(model.options);
        return resource
          ? {
              inputId: model.inputId,
              type: EPlayerInputType.RESOURCE,
              resource,
            }
          : null;
      }
      case EPlayerInputType.TRACE: {
        const trace = this.pickRandom(model.options);
        return trace
          ? { inputId: model.inputId, type: EPlayerInputType.TRACE, trace }
          : null;
      }
      case EPlayerInputType.END_OF_ROUND: {
        const card = this.pickRandom(model.cards);
        return card
          ? {
              inputId: model.inputId,
              type: EPlayerInputType.END_OF_ROUND,
              cardId: card.id,
            }
          : null;
      }
      case EPlayerInputType.OR: {
        if (model.options.length === 0) {
          return null;
        }
        const index = Math.floor(Math.random() * model.options.length);
        const response = this.pickRandomInputResponse(model.options[index]);
        if (!response) {
          return null;
        }
        return {
          inputId: model.inputId,
          type: EPlayerInputType.OR,
          index,
          response,
        };
      }
      case EPlayerInputType.AND: {
        const responses = model.options
          .map((item) => this.pickRandomInputResponse(item))
          .filter((response): response is IInputResponse => response !== null);
        if (responses.length !== model.options.length) {
          return null;
        }
        return {
          inputId: model.inputId,
          type: EPlayerInputType.AND,
          responses,
        };
      }
      default:
        return null;
    }
  }

  private pickRandom<TValue>(items: TValue[]): TValue | null {
    if (items.length === 0) {
      return null;
    }
    const index = Math.floor(Math.random() * items.length);
    return items[index] ?? null;
  }

  private shuffle<TValue>(items: TValue[]): TValue[] {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const rand = Math.floor(Math.random() * (index + 1));
      [next[index], next[rand]] = [next[rand], next[index]];
    }
    return next;
  }
}
