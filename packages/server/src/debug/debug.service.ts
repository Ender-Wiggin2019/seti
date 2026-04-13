import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import type { IPlayerInputModel } from '@seti/common/types/protocol/playerInput';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { IJwtPayload } from '@/auth/jwt-auth.guard.js';
import { Game } from '@/engine/Game.js';
import { createGameOptions } from '@/engine/GameOptions.js';
import type { IGamePlayerIdentity } from '@/engine/IGame.js';
import { GameManager } from '@/gateway/GameManager.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import { GameRepository } from '@/persistence/repository/GameRepository.js';
import {
  applyBehaviorFlowScenario,
  BEHAVIOR_FLOW_SEED,
} from '@/testing/behaviorFlowScenario.js';
import { DebugSessionRegistry } from './DebugSessionRegistry.js';

interface IDebugAuthUser {
  id: string;
  name: string;
  email: string;
}

export interface IDebugServerSessionResponse {
  gameId: string;
  accessToken: string;
  user: IDebugAuthUser;
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
    return this.getProjectedState(gameId, viewerId);
  }

  async processFreeAction(
    gameId: string,
    playerId: string,
    action: IFreeActionRequest,
    viewerId: string,
  ): Promise<IPublicGameState> {
    await this.gameManager.processFreeAction(gameId, playerId, action);
    return this.getProjectedState(gameId, viewerId);
  }

  async processInput(
    gameId: string,
    playerId: string,
    inputResponse: IInputResponse,
    viewerId: string,
  ): Promise<IPublicGameState> {
    await this.gameManager.processInput(gameId, playerId, inputResponse);
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
}
