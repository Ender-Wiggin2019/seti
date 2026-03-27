import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import type { IPlayerInputModel } from '@seti/common/types/protocol/playerInput';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import { GameRepository } from '@/persistence/repository/GameRepository.js';
import {
  projectGameState,
  serializeGame,
} from '@/persistence/serializer/GameSerializer.js';

const UNLOAD_TIMEOUT_MS = 5 * 60 * 1000;

export interface IPendingInput {
  playerId: string;
  input: IPlayerInputModel;
}

export interface IActionResult {
  states: Map<string, IPublicGameState>;
  pendingInputs: IPendingInput[];
  events: unknown[];
}

@Injectable()
export class GameManager {
  private readonly logger = new Logger(GameManager.name);
  private readonly cache = new Map<string, IGame>();
  private readonly versions = new Map<string, number>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly gameRepo: GameRepository;

  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {
    this.gameRepo = new GameRepository(db);
  }

  async getGame(gameId: string): Promise<IGame> {
    const cached = this.cache.get(gameId);
    if (cached) {
      this.refreshTimer(gameId);
      return cached;
    }

    const game = await this.gameRepo.loadGame(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    this.cache.set(gameId, game);

    const snapshot = await this.gameRepo.loadLatestSnapshot(gameId);
    this.versions.set(gameId, snapshot ? (snapshot as { version?: number }).version ?? 0 : 0);

    this.refreshTimer(gameId);
    return game;
  }

  async processAction(
    gameId: string,
    playerId: string,
    action: IMainActionRequest,
  ): Promise<IActionResult> {
    const game = await this.getGame(gameId);
    const version = this.nextVersion(gameId);

    game.processMainAction(playerId, action);

    await this.persistSnapshot(gameId, version, game, {
      type: 'MAIN_ACTION',
      lastActorId: playerId,
      action,
    });

    return this.buildResult(game);
  }

  async processFreeAction(
    gameId: string,
    playerId: string,
    action: IFreeActionRequest,
  ): Promise<IActionResult> {
    const game = await this.getGame(gameId);

    game.processFreeAction(playerId, action);

    return this.buildResult(game);
  }

  async processInput(
    gameId: string,
    playerId: string,
    response: IInputResponse,
  ): Promise<IActionResult> {
    const game = await this.getGame(gameId);
    const version = this.nextVersion(gameId);

    game.processInput(playerId, response);

    await this.persistSnapshot(gameId, version, game, {
      type: 'INPUT_RESPONSE',
      lastActorId: playerId,
    });

    return this.buildResult(game);
  }

  getProjectedState(gameId: string, viewerId: string): IPublicGameState | null {
    const game = this.cache.get(gameId);
    if (!game) {
      return null;
    }
    return projectGameState(game, viewerId);
  }

  isGameLoaded(gameId: string): boolean {
    return this.cache.has(gameId);
  }

  async unloadGame(gameId: string): Promise<void> {
    const game = this.cache.get(gameId);
    if (!game) {
      return;
    }

    const version = this.versions.get(gameId) ?? 0;
    await this.persistSnapshot(gameId, version, game, {
      type: 'UNLOAD',
    });

    this.cache.delete(gameId);
    this.versions.delete(gameId);
    this.clearTimer(gameId);
    this.logger.log(`Game ${gameId} unloaded from memory`);
  }

  private buildResult(game: IGame): IActionResult {
    const states = new Map<string, IPublicGameState>();
    const pendingInputs: IPendingInput[] = [];

    for (const player of game.players) {
      states.set(player.id, projectGameState(game, player.id));

      if (player.waitingFor) {
        const inputModel = this.toInputModel(player);
        if (inputModel) {
          pendingInputs.push({ playerId: player.id, input: inputModel });
        }
      }
    }

    const events = game.eventLog.recent(10);

    return { states, pendingInputs, events };
  }

  private toInputModel(player: IPlayer): IPlayerInputModel | null {
    if (!player.waitingFor) {
      return null;
    }
    return player.waitingFor.toModel();
  }

  private async persistSnapshot(
    gameId: string,
    version: number,
    game: IGame,
    event: unknown,
  ): Promise<void> {
    try {
      const dto = serializeGame(game, version);
      await this.gameRepo.saveSnapshot(gameId, version, dto, event);
    } catch (err) {
      this.logger.error(`Failed to persist snapshot for game ${gameId}`, err);
    }
  }

  private nextVersion(gameId: string): number {
    const current = this.versions.get(gameId) ?? 0;
    const next = current + 1;
    this.versions.set(gameId, next);
    return next;
  }

  private refreshTimer(gameId: string): void {
    this.clearTimer(gameId);
    const timer = setTimeout(() => {
      void this.unloadGame(gameId);
    }, UNLOAD_TIMEOUT_MS);
    this.timers.set(gameId, timer);
  }

  private clearTimer(gameId: string): void {
    const timer = this.timers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(gameId);
    }
  }
}
