import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import type { IPlayerInputModel } from '@seti/common/types/protocol/playerInput';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import type { IGameStateDto } from '@/persistence/dto/GameStateDto.js';
import { GameRepository } from '@/persistence/repository/GameRepository.js';
import { TurnCheckpointRepository } from '@/persistence/repository/TurnCheckpointRepository.js';
import { deserializeGame } from '@/persistence/serializer/GameDeserializer.js';
import {
  projectGameState,
  serializeGame,
} from '@/persistence/serializer/GameSerializer.js';
import { GameError } from '@/shared/errors/GameError.js';

const UNLOAD_TIMEOUT_MS = 5 * 60 * 1000;
/**
 * Persist a turn-start checkpoint to the DB only every Nth turn to
 * amortize serialization + write cost. Day-to-day undo is served
 * from the in-memory checkpoint, which is refreshed every turn.
 */
const DB_PERSIST_EVERY_TURNS = 4;

export interface IPendingInput {
  playerId: string;
  input: IPlayerInputModel;
}

export interface IActionResult {
  states: Map<string, IPublicGameState>;
  pendingInputs: IPendingInput[];
  events: unknown[];
}

export interface IUndoResult {
  states: Map<string, IPublicGameState>;
  undoneByPlayerId: string;
  turnIndex: number;
  interactedPlayerIds: string[];
}

interface ITurnCheckpointInMemory {
  turnIndex: number;
  playerId: string;
  round: number;
  stateDto: IGameStateDto;
  /**
   * Players other than the active player whose pending inputs were
   * resolved during this turn. Used to tell them "your interaction
   * was rolled back" when undo fires.
   */
  interactedPlayerIds: Set<string>;
}

@Injectable()
export class GameManager {
  private readonly logger = new Logger(GameManager.name);
  private readonly cache = new Map<string, IGame>();
  private readonly versions = new Map<string, number>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly turnCheckpoints = new Map<string, ITurnCheckpointInMemory>();
  private readonly gameRepo: GameRepository;
  private readonly turnCheckpointRepo: TurnCheckpointRepository;

  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {
    this.gameRepo = new GameRepository(db);
    this.turnCheckpointRepo = new TurnCheckpointRepository(db);
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
    this.versions.set(gameId, snapshot?.version ?? 0);

    await this.rehydrateTurnCheckpoint(gameId, game);

    this.refreshTimer(gameId);
    return game;
  }

  async processAction(
    gameId: string,
    playerId: string,
    action: IMainActionRequest,
  ): Promise<IActionResult> {
    const game = await this.getGame(gameId);
    const turnIndexBefore = game.turnIndex;
    const version = this.nextVersion(gameId);

    game.processMainAction(playerId, action);

    await this.persistSnapshot(gameId, version, game, {
      type: 'MAIN_ACTION',
      lastActorId: playerId,
      action,
    });
    await this.afterTurnMaybeChanged(gameId, game, turnIndexBefore);

    return this.buildResult(game, gameId);
  }

  async processEndTurn(
    gameId: string,
    playerId: string,
  ): Promise<IActionResult> {
    const game = await this.getGame(gameId);
    const turnIndexBefore = game.turnIndex;
    const version = this.nextVersion(gameId);

    game.processEndTurn(playerId);

    await this.persistSnapshot(gameId, version, game, {
      type: 'END_TURN',
      lastActorId: playerId,
    });
    await this.afterTurnMaybeChanged(gameId, game, turnIndexBefore);

    return this.buildResult(game, gameId);
  }

  async processFreeAction(
    gameId: string,
    playerId: string,
    action: IFreeActionRequest,
  ): Promise<IActionResult> {
    const game = await this.getGame(gameId);
    const turnIndexBefore = game.turnIndex;

    game.processFreeAction(playerId, action);

    // Free actions intentionally don't get their own gameSnapshots
    // row — the undo subsystem rolls back to the turn-start
    // checkpoint, which covers free actions automatically. We still
    // watch for a turn-index change (e.g. via a card effect that
    // forces a handoff) to refresh the checkpoint.
    await this.afterTurnMaybeChanged(gameId, game, turnIndexBefore);

    return this.buildResult(game, gameId);
  }

  async processInput(
    gameId: string,
    playerId: string,
    response: IInputResponse,
  ): Promise<IActionResult> {
    const game = await this.getGame(gameId);
    const turnIndexBefore = game.turnIndex;
    const version = this.nextVersion(gameId);

    game.processInput(playerId, response);

    await this.persistSnapshot(gameId, version, game, {
      type: 'INPUT_RESPONSE',
      lastActorId: playerId,
    });

    // If a non-active player answered an input prompt, mark them as
    // "interacted" for the current turn so we can notify them if the
    // active player later undoes.
    if (playerId !== game.activePlayer.id) {
      this.recordInteraction(gameId, playerId);
    }

    await this.afterTurnMaybeChanged(gameId, game, turnIndexBefore);

    return this.buildResult(game, gameId);
  }

  /**
   * Roll the game state back to the start of the current turn. Fails
   * with `GameError` if undo is disabled, the turn is locked, or the
   * requester is not the active player.
   */
  async undoToTurnStart(
    gameId: string,
    playerId: string,
  ): Promise<IUndoResult> {
    const game = await this.getGame(gameId);

    if (!game.options.undoAllowed) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Undo is disabled for this game',
      );
    }
    if (game.activePlayer.id !== playerId) {
      throw new GameError(
        EErrorCode.NOT_YOUR_TURN,
        'Only the active player may undo',
        { playerId, activePlayerId: game.activePlayer.id },
      );
    }
    if (game.turnLocked) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Undo is no longer available — a card was drawn this turn',
      );
    }

    const checkpoint = this.turnCheckpoints.get(gameId);
    if (!checkpoint || checkpoint.turnIndex !== game.turnIndex) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No undo checkpoint is available for this turn',
      );
    }

    const restored = deserializeGame(checkpoint.stateDto);
    this.cache.set(gameId, restored);

    const interactedPlayerIds = [...checkpoint.interactedPlayerIds].filter(
      (id) => id !== playerId,
    );
    // After restore the turn-start checkpoint is still valid — reset
    // interactions (the rollback invalidated any mid-turn work).
    checkpoint.interactedPlayerIds = new Set();

    const states = new Map<string, IPublicGameState>();
    for (const player of restored.players) {
      states.set(
        player.id,
        projectGameState(restored, player.id, { hasTurnCheckpoint: true }),
      );
    }

    return {
      states,
      undoneByPlayerId: playerId,
      turnIndex: restored.turnIndex,
      interactedPlayerIds,
    };
  }

  getProjectedState(gameId: string, viewerId: string): IPublicGameState | null {
    const game = this.cache.get(gameId);
    if (!game) {
      return null;
    }
    return projectGameState(game, viewerId, {
      hasTurnCheckpoint: this.hasValidCheckpoint(gameId, game),
    });
  }

  isGameLoaded(gameId: string): boolean {
    return this.cache.has(gameId);
  }

  registerGame(game: IGame): void {
    this.cache.set(game.id, game);
    this.versions.set(game.id, 0);
    this.refreshTimer(game.id);

    // Take an initial checkpoint for the very first turn so the
    // active player can undo right at game start.
    void this.captureCurrentTurnCheckpoint(game.id, game);
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
    this.turnCheckpoints.delete(gameId);
    this.clearTimer(gameId);
    this.logger.log(`Game ${gameId} unloaded from memory`);
  }

  private buildResult(game: IGame, gameId: string): IActionResult {
    const states = new Map<string, IPublicGameState>();
    const pendingInputs: IPendingInput[] = [];
    const hasCheckpoint = this.hasValidCheckpoint(gameId, game);

    for (const player of game.players) {
      states.set(
        player.id,
        projectGameState(game, player.id, {
          hasTurnCheckpoint: hasCheckpoint,
        }),
      );

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

  /**
   * After every engine operation, check whether the turn boundary
   * was crossed. If so, take a fresh in-memory checkpoint and
   * conditionally persist it to the DB (every `DB_PERSIST_EVERY_TURNS`
   * turns).
   */
  private async afterTurnMaybeChanged(
    gameId: string,
    game: IGame,
    turnIndexBefore: number,
  ): Promise<void> {
    if (game.turnIndex === turnIndexBefore) {
      return;
    }
    await this.captureCurrentTurnCheckpoint(gameId, game);
  }

  private async captureCurrentTurnCheckpoint(
    gameId: string,
    game: IGame,
  ): Promise<void> {
    if (!game.options.undoAllowed) {
      this.turnCheckpoints.delete(gameId);
      return;
    }
    if (game.turnIndex <= 0) {
      // Engine is still in SETUP; no turn-start to capture.
      return;
    }

    const stateDto = serializeGame(game, 0);
    this.turnCheckpoints.set(gameId, {
      turnIndex: game.turnIndex,
      playerId: game.activePlayer.id,
      round: game.round,
      stateDto,
      interactedPlayerIds: new Set(),
    });

    if (game.turnIndex % DB_PERSIST_EVERY_TURNS === 0) {
      try {
        await this.turnCheckpointRepo.save({
          gameId,
          turnIndex: game.turnIndex,
          playerId: game.activePlayer.id,
          round: game.round,
          state: stateDto,
          interactedPlayerIds: [],
        });
        // Keep only the latest DB checkpoint to avoid unbounded
        // growth — we never read the older ones anyway.
        await this.turnCheckpointRepo.pruneBefore(gameId, game.turnIndex);
      } catch (err) {
        this.logger.error(
          `Failed to persist turn checkpoint for game ${gameId} @ turn ${game.turnIndex}`,
          err,
        );
      }
    }
  }

  private recordInteraction(gameId: string, playerId: string): void {
    const checkpoint = this.turnCheckpoints.get(gameId);
    if (!checkpoint) {
      return;
    }
    checkpoint.interactedPlayerIds.add(playerId);
  }

  private hasValidCheckpoint(gameId: string, game: IGame): boolean {
    if (!game.options.undoAllowed) {
      return false;
    }
    const checkpoint = this.turnCheckpoints.get(gameId);
    return checkpoint !== undefined && checkpoint.turnIndex === game.turnIndex;
  }

  /**
   * When a game is loaded from DB (cache miss), check whether there
   * is a turn-start checkpoint in DB that matches the current turn
   * index. If so, rehydrate the in-memory checkpoint so undo is
   * still available. Otherwise leave it empty — undo will become
   * available again at the next turn boundary.
   */
  private async rehydrateTurnCheckpoint(
    gameId: string,
    game: IGame,
  ): Promise<void> {
    if (!game.options.undoAllowed) {
      return;
    }
    try {
      const row = await this.turnCheckpointRepo.loadLatest(gameId);
      if (!row || row.turnIndex !== game.turnIndex) {
        return;
      }
      this.turnCheckpoints.set(gameId, {
        turnIndex: row.turnIndex,
        playerId: row.playerId,
        round: row.round,
        stateDto: row.state,
        interactedPlayerIds: new Set(row.interactedPlayerIds),
      });
    } catch (err) {
      this.logger.warn(
        `Failed to rehydrate turn checkpoint for game ${gameId}`,
        err,
      );
    }
  }
}
