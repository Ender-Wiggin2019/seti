import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  IDebugReplayPresetDefinition,
  IDebugReplaySessionRequest,
  IDebugReplaySessionResponse,
  IDebugServerSessionResponse,
  IDebugSnapshotSessionRequest,
  IDebugSnapshotSessionResponse,
} from '@seti/common/types/protocol/debug';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import {
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
import { Game } from '@/engine/Game.js';
import { createGameOptions } from '@/engine/GameOptions.js';
import type { IGamePlayerIdentity } from '@/engine/IGame.js';
import { GameManager } from '@/gateway/GameManager.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import { GameRepository } from '@/persistence/repository/GameRepository.js';
import { deserializeGame } from '@/persistence/serializer/GameDeserializer.js';
import { GameError } from '@/shared/errors/GameError.js';
import {
  applyBehaviorFlowScenario,
  BEHAVIOR_FLOW_SEED,
} from '@/testing/behaviorFlowScenario.js';
import {
  applyDebugReplayPreset,
  listDebugReplayPresets,
} from './debugReplayPresets.js';
import { DebugSessionRegistry } from './DebugSessionRegistry.js';

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

const DEBUG_PLAYER_BLUEPRINTS: ReadonlyArray<{
  name: string;
  color: string;
}> = [
  { name: 'Commander Ada', color: 'red' },
  { name: 'Bot Vega', color: 'blue' },
];

const BEHAVIOR_FLOW_PLAYER_BLUEPRINTS: ReadonlyArray<{
  name: string;
  color: string;
}> = [
  { name: 'Alice', color: 'red' },
  { name: 'Bob', color: 'blue' },
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

@Injectable()
export class DebugService {
  private readonly logger = new Logger(DebugService.name);
  private readonly gameRepository: GameRepository;

  constructor(
    @Inject(DRIZZLE_DB) db: NodePgDatabase,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(GameManager) private readonly gameManager: GameManager,
    @Inject(DebugSessionRegistry)
    private readonly debugSessionRegistry: DebugSessionRegistry,
  ) {
    this.gameRepository = new GameRepository(db);
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

    const gameOptions = createGameOptions({ playerCount });
    const game = Game.create(players, gameOptions, seed, gameId);
    const replay = applyDebugReplayPreset(game, request);

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
    const snapshot =
      request.version !== undefined
        ? await this.gameRepository.loadSnapshot(request.gameId, request.version)
        : await this.gameRepository.loadLatestSnapshot(request.gameId);

    if (!snapshot) {
      throw new GameError(
        EErrorCode.GAME_NOT_FOUND,
        `No snapshot found for game ${request.gameId}${request.version !== undefined ? ` version ${request.version}` : ''}`,
      );
    }

    const sourceGameId = snapshot.gameId;
    const snapshotVersion = snapshot.version;
    snapshot.gameId = randomUUID();

    const game = deserializeGame(snapshot);

    const humanPlayer = game.players[0];
    const botPlayerIds = game.players
      .slice(1)
      .map((player) => player.id);

    this.debugSessionRegistry.register(
      game.id,
      humanPlayer.id,
      botPlayerIds,
    );
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

    const botProbeSpaces = state.solarSystem.probes
      .filter((probe) => probe.playerId === botPlayerId)
      .map((probe) => probe.spaceId);
    const shuffledSpaces = this.shuffle(botProbeSpaces);

    for (const fromSpaceId of shuffledSpaces) {
      const neighbors = this.shuffle(
        state.solarSystem.adjacency[fromSpaceId] ?? [],
      );
      for (const toSpaceId of neighbors) {
        try {
          await this.gameManager.processFreeAction(gameId, botPlayerId, {
            type: EFreeAction.MOVEMENT,
            path: [fromSpaceId, toSpaceId],
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
          ? { type: EPlayerInputType.OPTION, optionId: option.id }
          : null;
      }
      case EPlayerInputType.CARD: {
        const card = this.pickRandom(model.cards);
        if (!card) {
          return null;
        }
        return { type: EPlayerInputType.CARD, cardIds: [card.id] };
      }
      case EPlayerInputType.SECTOR: {
        const sector = this.pickRandom(model.options);
        return sector ? { type: EPlayerInputType.SECTOR, sector } : null;
      }
      case EPlayerInputType.PLANET: {
        const planet = this.pickRandom(model.options);
        return planet ? { type: EPlayerInputType.PLANET, planet } : null;
      }
      case EPlayerInputType.TECH: {
        const tech = this.pickRandom(model.options);
        return tech ? { type: EPlayerInputType.TECH, tech } : null;
      }
      case EPlayerInputType.GOLD_TILE: {
        const tileId = this.pickRandom(model.options);
        return tileId ? { type: EPlayerInputType.GOLD_TILE, tileId } : null;
      }
      case EPlayerInputType.RESOURCE: {
        const resource = this.pickRandom(model.options);
        return resource ? { type: EPlayerInputType.RESOURCE, resource } : null;
      }
      case EPlayerInputType.TRACE: {
        const trace = this.pickRandom(model.options);
        return trace ? { type: EPlayerInputType.TRACE, trace } : null;
      }
      case EPlayerInputType.END_OF_ROUND: {
        const card = this.pickRandom(model.cards);
        return card
          ? { type: EPlayerInputType.END_OF_ROUND, cardId: card.id }
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
        return { type: EPlayerInputType.OR, index, response };
      }
      case EPlayerInputType.AND: {
        const responses = model.options
          .map((item) => this.pickRandomInputResponse(item))
          .filter((response): response is IInputResponse => response !== null);
        if (responses.length !== model.options.length) {
          return null;
        }
        return { type: EPlayerInputType.AND, responses };
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
