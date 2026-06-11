import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import { EPhase } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EGameEventType,
  type TGameEvent,
} from '@seti/common/types/protocol/events';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import type { IPlayerInputModel } from '@seti/common/types/protocol/playerInput';
import type { IAnimationBatch } from '@seti/common/types/protocol/animation';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { createEventId, createUndoEvent } from '@/engine/event/GameEvent.js';
import type { Game } from '@/engine/Game.js';
import { isSoloMode } from '@/engine/GameOptions.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import type {
  IPendingResolutionJournal,
  TPendingResolutionStep,
} from '@/engine/resolution/PendingResolutionJournal.js';
import { RivalTurnController } from '@/engine/solo/RivalTurnController.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import type { IGameStateDto } from '@/persistence/dto/GameStateDto.js';
import { GameEventRepository } from '@/persistence/repository/GameEventRepository.js';
import { TurnSnapshotRepository } from '@/persistence/repository/TurnSnapshotRepository.js';
import { replayGameEvents } from '@/persistence/replay/GameEventReplay.js';
import { deserializeGame } from '@/persistence/serializer/GameDeserializer.js';
import {
  projectGameState,
  serializeGame,
} from '@/persistence/serializer/GameSerializer.js';
import { GameError } from '@/shared/errors/GameError.js';
import { buildAnimationBatch } from './AnimationProjector.js';

const UNLOAD_TIMEOUT_MS = 5 * 60 * 1000;

export interface IPendingInput {
  playerId: string;
  input: IPlayerInputModel;
}

export interface IActionResult {
  states: Map<string, IPublicGameState>;
  pendingInputs: IPendingInput[];
  events: TGameEvent[];
  animationBatches: IAnimationBatch[];
}

export interface IUndoResult {
  states: Map<string, IPublicGameState>;
  undoneByPlayerId: string;
  turnIndex: number;
  interactedPlayerIds: string[];
  events: TGameEvent[];
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

interface IMutationRollbackSnapshot {
  stateDto: IGameStateDto;
  version: number | undefined;
  checkpoint: ITurnCheckpointInMemory | undefined;
  lastCommittedSeq: number | undefined;
  lastCommittedTurnIndex: number | undefined;
}

@Injectable()
export class GameManager {
  private readonly logger = new Logger(GameManager.name);
  private readonly cache = new Map<string, IGame>();
  private readonly versions = new Map<string, number>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly turnCheckpoints = new Map<string, ITurnCheckpointInMemory>();
  /**
   * Seq of the last event durably committed to `game_events`. Same-turn
   * actions accumulate in memory above this watermark; a completed turn
   * commits everything since this seq in one transaction.
   */
  private readonly lastCommittedSeqs = new Map<string, number>();
  /**
   * Turn index at which the last commit happened. A turn is only
   * committed once the engine advances past it and the game settles.
   */
  private readonly lastCommittedTurnIndexes = new Map<string, number>();
  private readonly gameEventRepo: GameEventRepository;
  private readonly turnSnapshotRepo: TurnSnapshotRepository;

  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {
    this.gameEventRepo = new GameEventRepository(db);
    this.turnSnapshotRepo = new TurnSnapshotRepository(db);
  }

  async getGame(gameId: string): Promise<IGame> {
    const cached = this.cache.get(gameId);
    if (cached) {
      this.refreshTimer(gameId);
      return cached;
    }

    const snapshot = await this.turnSnapshotRepo.loadLatest(gameId);
    if (!snapshot) {
      throw new GameError(
        EErrorCode.GAME_NOT_FOUND,
        `Game ${gameId} not found`,
        { gameId },
      );
    }
    const persistedEvents = await this.gameEventRepo.loadSince(
      gameId,
      snapshot.seq,
    );
    const game = replayGameEvents(
      deserializeGame(snapshot.state),
      persistedEvents,
    );
    const recoveredVersion = this.versionAfterReplayingEvents(
      snapshot.state.version ?? 0,
      persistedEvents,
    );

    this.cache.set(gameId, game);
    this.versions.set(gameId, recoveredVersion);
    // The loaded in-memory state matches what is durably committed, so
    // the commit watermark starts at the current head.
    this.lastCommittedSeqs.set(gameId, this.latestEventSeq(game));
    this.lastCommittedTurnIndexes.set(gameId, game.turnIndex);

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
    this.prepareTurnTracking(gameId, game);
    return this.withMutationRollback(gameId, game, async () => {
      const seqBefore = this.latestEventSeq(game);
      const turnIndexBefore = game.turnIndex;
      const version = this.nextVersion(gameId);
      const resolutionBase = this.captureResolutionBase(game);

      game.processMainAction(playerId, action);
      this.recordResolutionStep(game, resolutionBase, {
        type: 'MAIN_ACTION',
        playerId,
        action,
      });

      const appended = game.eventLog.since(seqBefore);
      const animationBatches = this.buildAnimationBatchesForAppended(
        appended,
        playerId,
        turnIndexBefore,
        version,
      );
      await this.resolveAutomatedRivalTurns(gameId, game, animationBatches);
      await this.commitIfTurnComplete(gameId, game);

      return this.buildResult(game, gameId, seqBefore, animationBatches);
    });
  }

  async processEndTurn(
    gameId: string,
    playerId: string,
  ): Promise<IActionResult> {
    const game = await this.getGame(gameId);
    this.prepareTurnTracking(gameId, game);
    return this.withMutationRollback(gameId, game, async () => {
      const seqBefore = this.latestEventSeq(game);
      const turnIndexBefore = game.turnIndex;
      const version = this.nextVersion(gameId);

      game.processEndTurn(playerId);

      const appended = game.eventLog.since(seqBefore);
      const animationBatches = this.buildAnimationBatchesForAppended(
        appended,
        playerId,
        turnIndexBefore,
        version,
      );
      await this.resolveAutomatedRivalTurns(gameId, game, animationBatches);
      await this.commitIfTurnComplete(gameId, game);

      return this.buildResult(game, gameId, seqBefore, animationBatches);
    });
  }

  async processFreeAction(
    gameId: string,
    playerId: string,
    action: IFreeActionRequest,
  ): Promise<IActionResult> {
    const game = await this.getGame(gameId);
    this.prepareTurnTracking(gameId, game);
    return this.withMutationRollback(gameId, game, async () => {
      const seqBefore = this.latestEventSeq(game);
      const turnIndexBefore = game.turnIndex;
      const resolutionBase = this.captureResolutionBase(game);

      game.processFreeAction(playerId, action);
      this.recordResolutionStep(game, resolutionBase, {
        type: 'FREE_ACTION',
        playerId,
        action,
      });

      // Watch for a turn-index change (e.g. via a card effect that
      // forces a handoff) to refresh the checkpoint.
      const version = this.nextVersion(gameId);
      const appended = game.eventLog.since(seqBefore);
      const animationBatches = this.buildAnimationBatchesForAppended(
        appended,
        playerId,
        turnIndexBefore,
        version,
      );
      await this.resolveAutomatedRivalTurns(gameId, game, animationBatches);
      await this.commitIfTurnComplete(gameId, game);

      return this.buildResult(game, gameId, seqBefore, animationBatches);
    });
  }

  async processInput(
    gameId: string,
    playerId: string,
    response: IInputResponse,
  ): Promise<IActionResult> {
    const game = await this.getGame(gameId);
    this.validateInputResponseEnvelope(game, playerId, response);
    this.prepareTurnTracking(gameId, game);
    return this.withMutationRollback(gameId, game, async () => {
      const seqBefore = this.latestEventSeq(game);
      const turnIndexBefore = game.turnIndex;

      const version = this.nextVersion(gameId);
      // Inputs that arrive without an in-flight resolution journal need
      // a fresh base — e.g. setup-time tuck-income chains, where the
      // first prompt is fired by `GameSetup` rather than by a player
      // action, so `pendingResolutionJournal` is undefined when the
      // first response arrives. Capture the pre-mutation state as the
      // base so `recordResolutionStep` doesn't throw "Cannot persist
      // pending input without a resume base".
      const resolutionBase =
        game.pendingResolutionJournal === undefined
          ? this.captureResolutionBase(game)
          : undefined;
      game.processInput(playerId, response);
      this.recordResolutionStep(game, resolutionBase, {
        type: 'INPUT_RESPONSE',
        playerId,
        response,
      });

      const appended = game.eventLog.since(seqBefore);

      // If a non-active player answered an input prompt, mark them as
      // "interacted" for the current turn so we can notify them if the
      // active player later undoes.
      if (playerId !== game.activePlayer.id) {
        this.recordInteraction(gameId, playerId);
      }

      const animationBatches = this.buildAnimationBatchesForAppended(
        appended,
        playerId,
        turnIndexBefore,
        version,
      );
      await this.resolveAutomatedRivalTurns(gameId, game, animationBatches);
      await this.commitIfTurnComplete(gameId, game);

      return this.buildResult(game, gameId, seqBefore, animationBatches);
    });
  }

  private validateInputResponseEnvelope(
    game: IGame,
    playerId: string,
    response: IInputResponse,
  ): void {
    const player = game.players.find((item) => item.id === playerId);
    if (!player) {
      throw new GameError(
        EErrorCode.PLAYER_NOT_FOUND,
        `Unknown player id: ${playerId}`,
        { playerId },
      );
    }
    const pendingInput = player?.waitingFor;
    if (!pendingInput) {
      throw new GameError(
        EErrorCode.STALE_INPUT_RESPONSE,
        'No active input prompt',
        { playerId },
      );
    }

    if (response.inputId !== pendingInput.inputId) {
      throw new GameError(
        EErrorCode.STALE_INPUT_RESPONSE,
        'Input response is no longer active',
        {
          expectedInputId: pendingInput.inputId,
          actualInputId: response.inputId,
          playerId,
        },
      );
    }
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
    return this.withMutationRollback(gameId, game, async () => {
      return this.undoToTurnStartWithoutRollback(gameId, playerId, game);
    });
  }

  private async undoToTurnStartWithoutRollback(
    gameId: string,
    playerId: string,
    game: IGame,
  ): Promise<IUndoResult> {
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

    const undoSeq = this.latestEventSeq(game) + 1;
    const restored = deserializeGame(checkpoint.stateDto);
    this.cache.set(gameId, restored);

    const interactedPlayerIds = [...checkpoint.interactedPlayerIds].filter(
      (id) => id !== playerId,
    );
    // Undo before commit is an in-memory rollback only: committed turns
    // cannot be undone, and same-turn work was never persisted. The UNDO
    // log event is ephemeral — returned for the live feed but not appended
    // to the durable event stream or written to the DB.
    const undoEvent = {
      ...createUndoEvent(playerId, interactedPlayerIds),
      id: createEventId(undoSeq),
      seq: undoSeq,
      turnIndex: restored.turnIndex,
      round: restored.round,
    } as TGameEvent;

    // After restore the turn-start checkpoint is still valid — reset
    // interactions (the rollback invalidated any mid-turn work).
    checkpoint.interactedPlayerIds = new Set();
    checkpoint.stateDto = serializeGame(
      restored,
      this.versions.get(gameId) ?? 0,
    );
    // The in-memory state now matches the last committed turn snapshot, so
    // realign the commit watermark to the restored turn start.
    this.lastCommittedSeqs.set(gameId, this.latestEventSeq(restored));
    this.lastCommittedTurnIndexes.set(gameId, restored.turnIndex);

    const states = new Map<string, IPublicGameState>();
    for (const player of restored.players) {
      states.set(
        player.id,
        projectGameState(restored, player.id, {
          hasTurnCheckpoint: true,
          version: this.versions.get(gameId) ?? 0,
        }),
      );
    }

    return {
      states,
      undoneByPlayerId: playerId,
      turnIndex: restored.turnIndex,
      interactedPlayerIds,
      events: [undoEvent],
    };
  }

  getProjectedState(gameId: string, viewerId: string): IPublicGameState | null {
    const game = this.cache.get(gameId);
    if (!game) {
      return null;
    }
    return projectGameState(game, viewerId, {
      hasTurnCheckpoint: this.hasValidCheckpoint(gameId, game),
      version: this.versions.get(gameId) ?? 0,
    });
  }

  isGameLoaded(gameId: string): boolean {
    return this.cache.has(gameId);
  }

  registerGame(game: IGame): void {
    this.cache.set(game.id, game);
    this.versions.set(game.id, 0);
    this.refreshTimer(game.id);
    this.resolveAutomatedRivalTurnsInMemory(game);

    // The freshly registered game starts fully committed at its current
    // turn; subsequent same-turn work accumulates above this watermark.
    this.lastCommittedSeqs.set(game.id, this.latestEventSeq(game));
    this.lastCommittedTurnIndexes.set(game.id, game.turnIndex);

    // Take an initial checkpoint for the very first turn so the
    // active player can undo right at game start.
    void this.captureCurrentTurnCheckpoint(game.id, game);
  }

  async unloadGame(gameId: string): Promise<void> {
    const game = this.cache.get(gameId);
    if (!game) {
      return;
    }

    this.cache.delete(gameId);
    this.versions.delete(gameId);
    this.turnCheckpoints.delete(gameId);
    this.lastCommittedSeqs.delete(gameId);
    this.lastCommittedTurnIndexes.delete(gameId);
    this.clearTimer(gameId);
    this.logger.log(`Game ${gameId} unloaded from memory`);
  }

  private buildResult(
    game: IGame,
    gameId: string,
    seqBefore: number,
    animationBatches: IAnimationBatch[],
  ): IActionResult {
    const states = new Map<string, IPublicGameState>();
    const pendingInputs: IPendingInput[] = [];
    const hasCheckpoint = this.hasValidCheckpoint(gameId, game);

    for (const player of game.players) {
      states.set(
        player.id,
        projectGameState(game, player.id, {
          hasTurnCheckpoint: hasCheckpoint,
          version: this.versions.get(gameId) ?? 0,
        }),
      );

      if (player.waitingFor) {
        const inputModel = this.toInputModel(player);
        if (inputModel) {
          pendingInputs.push({ playerId: player.id, input: inputModel });
        }
      }
    }

    const events = game.eventLog.since(seqBefore);

    return { states, pendingInputs, events, animationBatches };
  }

  private toInputModel(player: IPlayer): IPlayerInputModel | null {
    if (!player.waitingFor) {
      return null;
    }
    return player.waitingFor.toModel();
  }

  /**
   * Initialize the commit watermark and refresh the in-memory undo
   * checkpoint at the genuine start of a turn (before the engine mutates).
   * The watermark defaults to the current head so the next turn boundary
   * commits everything appended from here on. The checkpoint is only
   * re-captured while no same-turn work has accumulated yet, so undo
   * always rolls back to the true turn-start state.
   */
  private prepareTurnTracking(gameId: string, game: IGame): void {
    if (!this.lastCommittedSeqs.has(gameId)) {
      this.lastCommittedSeqs.set(gameId, this.latestEventSeq(game));
    }
    if (!this.lastCommittedTurnIndexes.has(gameId)) {
      this.lastCommittedTurnIndexes.set(gameId, game.turnIndex);
    }

    if (!game.options.undoAllowed || game.turnIndex <= 0) {
      return;
    }
    // Only refresh at a fresh turn start — no events appended since the
    // last commit yet.
    if (this.latestEventSeq(game) !== this.lastCommittedSeqs.get(gameId)) {
      return;
    }
    const existing = this.turnCheckpoints.get(gameId);
    const sameTurn = existing?.turnIndex === game.turnIndex;
    this.turnCheckpoints.set(gameId, {
      turnIndex: game.turnIndex,
      playerId: game.activePlayer.id,
      round: game.round,
      stateDto: serializeGame(game, this.versions.get(gameId) ?? 0),
      interactedPlayerIds: sameTurn
        ? existing.interactedPlayerIds
        : new Set(),
    });
  }

  /**
   * Commit the whole turn's accumulated events plus the new turn-start
   * snapshot once the engine has settled past a turn boundary. Same-turn
   * work and turns still waiting on pending input stay in memory only.
   */
  private async commitIfTurnComplete(
    gameId: string,
    game: IGame,
  ): Promise<void> {
    // A turn is tentative while any player still owes an input response.
    if (this.hasPendingInput(game)) {
      return;
    }

    const committedTurnIndex =
      this.lastCommittedTurnIndexes.get(gameId) ?? game.turnIndex;
    if (game.turnIndex <= committedTurnIndex) {
      return;
    }

    const snapshot = this.buildCurrentTurnSnapshot(gameId, game);
    if (!snapshot) {
      return;
    }

    const lastCommittedSeq = this.lastCommittedSeqs.get(gameId) ?? 0;
    const events = game.eventLog.since(lastCommittedSeq);

    await this.persistEventsAndTurnSnapshotInTransaction(
      gameId,
      events,
      snapshot,
    );

    this.lastCommittedSeqs.set(gameId, snapshot.seq);
    this.lastCommittedTurnIndexes.set(gameId, game.turnIndex);
  }

  private async persistEventsAndTurnSnapshotInTransaction(
    gameId: string,
    events: TGameEvent[],
    snapshot: Parameters<TurnSnapshotRepository['save']>[0],
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await new GameEventRepository(tx as NodePgDatabase).appendMany(
        gameId,
        events,
      );
      await new TurnSnapshotRepository(tx as NodePgDatabase).save(snapshot);
    });
  }

  private nextVersion(gameId: string): number {
    const current = this.versions.get(gameId) ?? 0;
    const next = current + 1;
    this.versions.set(gameId, next);
    return next;
  }

  private versionAfterReplayingEvents(
    baseVersion: number,
    events: TGameEvent[],
  ): number {
    return (
      baseVersion +
      events.filter((event) => this.isReplayCommandEvent(event)).length
    );
  }

  private isReplayCommandEvent(event: TGameEvent): boolean {
    switch (event.type) {
      case EGameEventType.FREE_ACTION:
      case EGameEventType.INPUT:
        return true;
      case EGameEventType.ACTION:
        return (
          typeof event.action !== 'string' ||
          event.action === 'END_TURN' ||
          event.action === 'RIVAL_ACTION' ||
          event.action === 'RIVAL_PASS'
        );
      default:
        return false;
    }
  }

  private latestEventSeq(game: IGame): number {
    return game.eventLog.toArray().at(-1)?.seq ?? 0;
  }

  private buildAnimationBatchesForAppended(
    appended: TGameEvent[],
    actorId: string,
    turnIndex: number,
    finalStateVersion: number,
  ): IAnimationBatch[] {
    const batch = buildAnimationBatch(
      appended,
      actorId,
      turnIndex,
      finalStateVersion,
    );
    return batch ? [batch] : [];
  }

  private captureResolutionBase(game: IGame): IGameStateDto {
    const state = serializeGame(game, 0);
    delete state.pendingResolution;
    return state;
  }

  private recordResolutionStep(
    game: IGame,
    baseState: IGameStateDto | undefined,
    step: TPendingResolutionStep,
  ): void {
    if (!this.hasPendingInput(game)) {
      if (game.phase !== EPhase.IN_RESOLUTION) {
        game.pendingResolutionJournal = undefined;
      }
      return;
    }

    const previous = game.pendingResolutionJournal as
      | IPendingResolutionJournal<IGameStateDto>
      | undefined;
    const nextBaseState = previous?.baseState ?? baseState;
    if (!nextBaseState) {
      throw new Error('Cannot persist pending input without a resume base');
    }

    game.pendingResolutionJournal = {
      version: 1,
      baseState: nextBaseState,
      steps: [...(previous?.steps ?? []), step],
    };
  }

  private async withMutationRollback<TResult>(
    gameId: string,
    game: IGame,
    work: () => Promise<TResult>,
  ): Promise<TResult> {
    const rollbackSnapshot = this.captureMutationRollback(gameId, game);

    try {
      return await work();
    } catch (error) {
      this.restoreMutationRollback(gameId, rollbackSnapshot);
      throw error;
    }
  }

  private captureMutationRollback(
    gameId: string,
    game: IGame,
  ): IMutationRollbackSnapshot {
    const version = this.versions.get(gameId);
    return {
      stateDto: serializeGame(game, version ?? 0),
      version,
      checkpoint: this.cloneTurnCheckpoint(this.turnCheckpoints.get(gameId)),
      lastCommittedSeq: this.lastCommittedSeqs.get(gameId),
      lastCommittedTurnIndex: this.lastCommittedTurnIndexes.get(gameId),
    };
  }

  private restoreMutationRollback(
    gameId: string,
    snapshot: IMutationRollbackSnapshot,
  ): void {
    this.cache.set(gameId, deserializeGame(snapshot.stateDto));
    if (snapshot.version === undefined) {
      this.versions.delete(gameId);
    } else {
      this.versions.set(gameId, snapshot.version);
    }

    if (snapshot.lastCommittedSeq === undefined) {
      this.lastCommittedSeqs.delete(gameId);
    } else {
      this.lastCommittedSeqs.set(gameId, snapshot.lastCommittedSeq);
    }
    if (snapshot.lastCommittedTurnIndex === undefined) {
      this.lastCommittedTurnIndexes.delete(gameId);
    } else {
      this.lastCommittedTurnIndexes.set(
        gameId,
        snapshot.lastCommittedTurnIndex,
      );
    }

    if (snapshot.checkpoint) {
      const checkpoint = this.cloneTurnCheckpoint(snapshot.checkpoint);
      if (checkpoint) {
        this.turnCheckpoints.set(gameId, checkpoint);
      }
    } else {
      this.turnCheckpoints.delete(gameId);
    }
  }

  private cloneTurnCheckpoint(
    checkpoint: ITurnCheckpointInMemory | undefined,
  ): ITurnCheckpointInMemory | undefined {
    if (!checkpoint) {
      return undefined;
    }
    return {
      turnIndex: checkpoint.turnIndex,
      playerId: checkpoint.playerId,
      round: checkpoint.round,
      stateDto: structuredClone(checkpoint.stateDto),
      interactedPlayerIds: new Set(checkpoint.interactedPlayerIds),
    };
  }

  private hasPendingInput(game: IGame): boolean {
    return game.players.some((player) => player.waitingFor !== undefined);
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

  private async resolveAutomatedRivalTurns(
    gameId: string,
    game: IGame,
    animationBatches: IAnimationBatch[],
  ): Promise<void> {
    let guard = 0;
    while (this.shouldResolveAutomatedRivalTurn(game)) {
      guard += 1;
      if (guard > 20) {
        throw new Error('Rival automation exceeded turn guard');
      }

      const turnIndexBefore = game.turnIndex;
      const seqBefore = this.latestEventSeq(game);
      RivalTurnController.resolveCurrentTurn(game as Game);
      const version = this.nextVersion(gameId);
      const appended = game.eventLog.since(seqBefore);
      const rivalActorId = game.rivalState?.rivalPlayerId;
      if (rivalActorId) {
        const batch = buildAnimationBatch(
          appended,
          rivalActorId,
          turnIndexBefore,
          version,
        );
        if (batch) {
          animationBatches.push(batch);
        }
      }
    }
  }

  private resolveAutomatedRivalTurnsInMemory(game: IGame): void {
    let guard = 0;
    while (this.shouldResolveAutomatedRivalTurn(game)) {
      guard += 1;
      if (guard > 20) {
        throw new Error('Rival automation exceeded turn guard');
      }
      RivalTurnController.resolveCurrentTurn(game as Game);
    }
  }

  private shouldResolveAutomatedRivalTurn(game: IGame): boolean {
    if (!isSoloMode(game.options) || !game.rivalState) {
      return false;
    }
    if (
      game.players.some(
        (player) =>
          player.id !== game.rivalState?.rivalPlayerId && player.waitingFor,
      )
    ) {
      return false;
    }
    return (
      game.phase === EPhase.AWAIT_MAIN_ACTION &&
      game.activePlayer.id === game.rivalState.rivalPlayerId
    );
  }

  private async captureCurrentTurnCheckpoint(
    gameId: string,
    game: IGame,
  ): Promise<void> {
    const snapshot = this.buildCurrentTurnSnapshot(gameId, game);
    if (!snapshot) return;

    await this.turnSnapshotRepo.save(snapshot);
  }

  private buildCurrentTurnSnapshot(
    gameId: string,
    game: IGame,
  ): Parameters<TurnSnapshotRepository['save']>[0] | null {
    if (game.turnIndex <= 0) {
      // Engine is still in SETUP; no turn-start to capture.
      return null;
    }

    const stateDto = serializeGame(game, this.versions.get(gameId) ?? 0);
    if (game.options.undoAllowed) {
      this.turnCheckpoints.set(gameId, {
        turnIndex: game.turnIndex,
        playerId: game.activePlayer.id,
        round: game.round,
        stateDto,
        interactedPlayerIds: new Set(),
      });
    } else {
      this.turnCheckpoints.delete(gameId);
    }

    return {
      gameId,
      turnIndex: game.turnIndex,
      seq: this.latestEventSeq(game),
      playerId: game.activePlayer.id,
      round: game.round,
      state: stateDto,
      interactedPlayerIds: [],
    };
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
      const row = await this.turnSnapshotRepo.loadLatest(gameId);
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
