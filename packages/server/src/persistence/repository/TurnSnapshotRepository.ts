import { and, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { IGameStateDto } from '../dto/GameStateDto.js';
import { turnSnapshots } from '../schema/turnSnapshots.js';

export interface ITurnSnapshotRecord {
  gameId: string;
  turnIndex: number;
  seq: number;
  playerId: string;
  round: number;
  state: IGameStateDto;
  interactedPlayerIds: string[];
}

export interface ITurnSnapshotSaveInput {
  gameId: string;
  turnIndex: number;
  seq: number;
  playerId: string;
  round: number;
  state: IGameStateDto;
  interactedPlayerIds: string[];
}

export class TurnSnapshotRepository {
  public constructor(private readonly db: NodePgDatabase) {}

  public async save(input: ITurnSnapshotSaveInput): Promise<void> {
    await this.db
      .insert(turnSnapshots)
      .values({
        gameId: input.gameId,
        turnIndex: input.turnIndex,
        seq: input.seq,
        playerId: input.playerId,
        round: input.round,
        state: input.state,
        interactedPlayerIds: input.interactedPlayerIds,
      })
      .onConflictDoUpdate({
        target: [turnSnapshots.gameId, turnSnapshots.turnIndex],
        set: {
          seq: input.seq,
          playerId: input.playerId,
          round: input.round,
          state: input.state,
          interactedPlayerIds: input.interactedPlayerIds,
        },
      });
  }

  public async loadLatest(
    gameId: string,
  ): Promise<ITurnSnapshotRecord | null> {
    const [row] = await this.db
      .select()
      .from(turnSnapshots)
      .where(eq(turnSnapshots.gameId, gameId))
      .orderBy(desc(turnSnapshots.turnIndex))
      .limit(1);
    if (!row) {
      return null;
    }
    return {
      gameId: row.gameId,
      turnIndex: row.turnIndex,
      seq: row.seq,
      playerId: row.playerId,
      round: row.round,
      state: row.state as IGameStateDto,
      interactedPlayerIds: (row.interactedPlayerIds as string[]) ?? [],
    };
  }

  public async loadByTurn(
    gameId: string,
    turnIndex: number,
  ): Promise<ITurnSnapshotRecord | null> {
    const [row] = await this.db
      .select()
      .from(turnSnapshots)
      .where(
        and(
          eq(turnSnapshots.gameId, gameId),
          eq(turnSnapshots.turnIndex, turnIndex),
        ),
      )
      .limit(1);
    if (!row) {
      return null;
    }
    return {
      gameId: row.gameId,
      turnIndex: row.turnIndex,
      seq: row.seq,
      playerId: row.playerId,
      round: row.round,
      state: row.state as IGameStateDto,
      interactedPlayerIds: (row.interactedPlayerIds as string[]) ?? [],
    };
  }

  public async deleteAll(gameId: string): Promise<void> {
    await this.db.delete(turnSnapshots).where(eq(turnSnapshots.gameId, gameId));
  }
}
