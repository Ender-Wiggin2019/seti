import { and, desc, eq, lt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { IGameStateDto } from '../dto/GameStateDto.js';
import { turnCheckpoints } from '../schema/turnCheckpoints.js';

export interface ITurnCheckpointRecord {
  gameId: string;
  turnIndex: number;
  playerId: string;
  round: number;
  state: IGameStateDto;
  interactedPlayerIds: string[];
}

export interface ITurnCheckpointSaveInput {
  gameId: string;
  turnIndex: number;
  playerId: string;
  round: number;
  state: IGameStateDto;
  interactedPlayerIds: string[];
}

/**
 * Persists periodic (every Nth turn) snapshots used by the undo
 * subsystem to restore "start of current turn" when the in-memory
 * checkpoint is unavailable (e.g. after server restart / game
 * unload).
 */
export class TurnCheckpointRepository {
  public constructor(private readonly db: NodePgDatabase) {}

  /**
   * Upsert a checkpoint row for `(gameId, turnIndex)`.
   *
   * Two checkpoints for the same turn would only happen if a game is
   * reloaded and the engine re-enters the same turn — we keep
   * idempotent behavior just in case.
   */
  public async save(input: ITurnCheckpointSaveInput): Promise<void> {
    await this.db
      .insert(turnCheckpoints)
      .values({
        gameId: input.gameId,
        turnIndex: input.turnIndex,
        playerId: input.playerId,
        round: input.round,
        state: input.state,
        interactedPlayerIds: input.interactedPlayerIds,
      })
      .onConflictDoUpdate({
        target: [turnCheckpoints.gameId, turnCheckpoints.turnIndex],
        set: {
          playerId: input.playerId,
          round: input.round,
          state: input.state,
          interactedPlayerIds: input.interactedPlayerIds,
        },
      });
  }

  /**
   * Return the checkpoint with the highest turn index for this game,
   * or `null` if no checkpoint has been saved yet.
   */
  public async loadLatest(
    gameId: string,
  ): Promise<ITurnCheckpointRecord | null> {
    const [row] = await this.db
      .select()
      .from(turnCheckpoints)
      .where(eq(turnCheckpoints.gameId, gameId))
      .orderBy(desc(turnCheckpoints.turnIndex))
      .limit(1);
    if (!row) {
      return null;
    }
    return {
      gameId: row.gameId,
      turnIndex: row.turnIndex,
      playerId: row.playerId,
      round: row.round,
      state: row.state as IGameStateDto,
      interactedPlayerIds: (row.interactedPlayerIds as string[]) ?? [],
    };
  }

  /**
   * Delete any checkpoints with `turn_index < beforeTurnIndex` for
   * this game. Called after a successful save to keep only recent
   * history — the undo feature never restores more than the
   * current-turn checkpoint, so older rows are pure bloat.
   */
  public async pruneBefore(
    gameId: string,
    beforeTurnIndex: number,
  ): Promise<void> {
    if (beforeTurnIndex <= 0) {
      return;
    }
    await this.db
      .delete(turnCheckpoints)
      .where(
        and(
          eq(turnCheckpoints.gameId, gameId),
          lt(turnCheckpoints.turnIndex, beforeTurnIndex),
        ),
      );
  }

  /**
   * Remove ALL checkpoints for a game (used when undo is disabled
   * and we want to tidy up). Safe no-op if no rows exist.
   */
  public async deleteAll(gameId: string): Promise<void> {
    await this.db
      .delete(turnCheckpoints)
      .where(eq(turnCheckpoints.gameId, gameId));
  }
}
