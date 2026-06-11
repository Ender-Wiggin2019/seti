import type {
  EGameEventType,
  TGameEvent,
} from '@seti/common/types/protocol/events';
import { and, count, eq, gt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { gameEvents } from '../schema/gameEvents.js';

export class GameEventRepository {
  public constructor(private readonly db: NodePgDatabase) {}

  public async appendMany(gameId: string, events: TGameEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await this.db
      .insert(gameEvents)
      .values(
        events.map((event) => ({
          gameId,
          seq: event.seq,
          turnIndex: event.turnIndex,
          round: event.round,
          actorId: event.actorId,
          type: event.type,
          payload: event,
        })),
      )
      .onConflictDoNothing({
        target: [gameEvents.gameId, gameEvents.seq],
      });
  }

  public async loadSince(gameId: string, seq: number): Promise<TGameEvent[]> {
    const rows = await this.db
      .select({ payload: gameEvents.payload })
      .from(gameEvents)
      .where(and(eq(gameEvents.gameId, gameId), gt(gameEvents.seq, seq)))
      .orderBy(gameEvents.seq);

    return rows.map((row) => row.payload as TGameEvent);
  }

  public async loadByTurn(
    gameId: string,
    turnIndex: number,
  ): Promise<TGameEvent[]> {
    const rows = await this.db
      .select({ payload: gameEvents.payload })
      .from(gameEvents)
      .where(
        and(
          eq(gameEvents.gameId, gameId),
          eq(gameEvents.turnIndex, turnIndex),
        ),
      )
      .orderBy(gameEvents.seq);

    return rows.map((row) => row.payload as TGameEvent);
  }

  public async loadByActor(
    gameId: string,
    actorId: string,
  ): Promise<TGameEvent[]> {
    const rows = await this.db
      .select({ payload: gameEvents.payload })
      .from(gameEvents)
      .where(and(eq(gameEvents.gameId, gameId), eq(gameEvents.actorId, actorId)))
      .orderBy(gameEvents.seq);

    return rows.map((row) => row.payload as TGameEvent);
  }

  public async countByType(
    gameId: string,
  ): Promise<Partial<Record<EGameEventType, number>>> {
    const rows = await this.db
      .select({ type: gameEvents.type, count: count() })
      .from(gameEvents)
      .where(eq(gameEvents.gameId, gameId))
      .groupBy(gameEvents.type);

    return Object.fromEntries(
      rows.map((row) => [
        row.type as EGameEventType,
        typeof row.count === 'number' ? row.count : Number(row.count),
      ]),
    ) as Partial<Record<EGameEventType, number>>;
  }
}
