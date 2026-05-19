import { EPhase } from '@seti/common/types/protocol/enums';
import { and, desc, eq, gt, lt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { IGame } from '@/engine/IGame.js';
import type { IGameStateDto } from '../dto/GameStateDto.js';
import { gameSnapshots } from '../schema/gameSnapshots.js';
import { games } from '../schema/games.js';
import { deserializeGame } from '../serializer/GameDeserializer.js';
import { serializeGame } from '../serializer/GameSerializer.js';

export type TGameStatus = 'waiting' | 'playing' | 'finished';

export interface IUndoOptions {
  actorId?: string;
  depth?: number;
}

export class GameRepository {
  public constructor(private readonly db: NodePgDatabase) {}

  public async startFromLobby(game: IGame): Promise<void> {
    await this.db
      .update(games)
      .set({
        status: this.toStatus(game.phase),
        playerCount: game.options.playerCount,
        currentRound: game.round,
        seed: game.seed,
        options: game.options,
        updatedAt: new Date(),
      })
      .where(eq(games.id, game.id));

    const versionZero = await this.loadSnapshot(game.id, 0);
    if (!versionZero) {
      await this.saveSnapshot(game.id, 0, serializeGame(game, 0), {
        type: 'GAME_STARTED',
      });
    }
  }

  public async create(game: IGame): Promise<void> {
    await this.db.insert(games).values({
      id: game.id,
      status: this.toStatus(game.phase),
      playerCount: game.options.playerCount,
      currentRound: game.round,
      seed: game.seed,
      options: game.options,
    });

    await this.saveSnapshot(game.id, 0, serializeGame(game, 0), {
      type: 'GAME_CREATED',
    });
  }

  public async saveSnapshot(
    gameId: string,
    version: number,
    stateDto: IGameStateDto,
    event: unknown,
  ): Promise<void> {
    await this.db.insert(gameSnapshots).values({
      gameId,
      version,
      state: stateDto,
      event: event as object,
    });
  }

  public async loadLatestSnapshot(
    gameId: string,
  ): Promise<IGameStateDto | null> {
    const [row] = await this.db
      .select({ state: gameSnapshots.state })
      .from(gameSnapshots)
      .where(eq(gameSnapshots.gameId, gameId))
      .orderBy(desc(gameSnapshots.version))
      .limit(1);

    return (row?.state as IGameStateDto | undefined) ?? null;
  }

  /**
   * Cap the snapshot history for a game by deleting all rows whose
   * version is below the keep-window. The window keeps the latest
   * `keep` snapshots so undo (which needs the previous N versions) and
   * the GAME_CREATED checkpoint (version 0) keep working — version 0
   * is preserved unconditionally because it's the only seed for a full
   * load when the cache is cold.
   *
   * Called from `GameManager.unloadGame` so an idle long-running room
   * doesn't accumulate hundreds of snapshot rows. `turnCheckpoints` is
   * already pruned via its own `pruneBefore` step; this brings
   * snapshots in line.
   */
  public async pruneSnapshots(
    gameId: string,
    keep = 50,
  ): Promise<number> {
    const recent = await this.db
      .select({ version: gameSnapshots.version })
      .from(gameSnapshots)
      .where(eq(gameSnapshots.gameId, gameId))
      .orderBy(desc(gameSnapshots.version))
      .limit(keep);
    if (recent.length < keep) {
      return 0;
    }
    const oldestKept = recent[recent.length - 1].version;
    if (oldestKept <= 0) {
      // Already inside the keep window with version 0 in scope; nothing
      // to delete (zero is preserved unconditionally below in any case).
      return 0;
    }
    const result = await this.db
      .delete(gameSnapshots)
      .where(
        and(
          eq(gameSnapshots.gameId, gameId),
          // Keep version 0 (GAME_CREATED seed) regardless of the window.
          gt(gameSnapshots.version, 0),
          // Delete anything older than the window's tail.
          // `< oldestKept` because rows at `oldestKept` itself stay.
          // drizzle's `lt` mirrors `<`.
          lt(gameSnapshots.version, oldestKept),
        ),
      );
    // Drizzle returns NodePg's QueryResult; rowCount is sometimes
    // null. Coerce so callers see a number.
    return (result as { rowCount?: number | null }).rowCount ?? 0;
  }

  public async loadSnapshot(
    gameId: string,
    version: number,
  ): Promise<IGameStateDto | null> {
    const [row] = await this.db
      .select({ state: gameSnapshots.state })
      .from(gameSnapshots)
      .where(
        and(
          eq(gameSnapshots.gameId, gameId),
          eq(gameSnapshots.version, version),
        ),
      )
      .limit(1);

    return (row?.state as IGameStateDto | undefined) ?? null;
  }

  public async undo(
    gameId: string,
    options: IUndoOptions = {},
  ): Promise<IGameStateDto | null> {
    const depth = options.depth ?? 1;
    if (depth < 1) {
      throw new Error('Undo depth must be >= 1');
    }

    return this.db.transaction(async (tx) => {
      const snapshots = await tx
        .select({
          version: gameSnapshots.version,
          state: gameSnapshots.state,
          event: gameSnapshots.event,
        })
        .from(gameSnapshots)
        .where(eq(gameSnapshots.gameId, gameId))
        .orderBy(desc(gameSnapshots.version))
        .limit(depth + 1);

      if (snapshots.length <= depth) {
        return null;
      }

      const latest = snapshots[0];
      const target = snapshots[depth];

      if (options.actorId) {
        const latestActorId =
          (latest.event as { actorId?: string } | null | undefined)?.actorId ??
          (latest.event as { lastActorId?: string } | null | undefined)
            ?.lastActorId;
        if (latestActorId !== options.actorId) {
          throw new Error('Undo rejected: only last acting player may undo');
        }
      }

      await tx
        .delete(gameSnapshots)
        .where(
          and(
            eq(gameSnapshots.gameId, gameId),
            gt(gameSnapshots.version, target.version),
          ),
        );

      return target.state as IGameStateDto;
    });
  }

  public async findByStatus(status: TGameStatus): Promise<string[]> {
    const rows = await this.db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.status, status));
    return rows.map((row) => row.id);
  }

  public async updateStatus(
    gameId: string,
    status: TGameStatus,
  ): Promise<void> {
    await this.db
      .update(games)
      .set({ status, updatedAt: new Date() })
      .where(eq(games.id, gameId));
  }

  public async loadGame(gameId: string): Promise<IGame | null> {
    const snapshot = await this.loadLatestSnapshot(gameId);
    if (!snapshot) {
      return null;
    }
    return deserializeGame(snapshot);
  }

  private toStatus(phase: EPhase): TGameStatus {
    if (phase === EPhase.SETUP) {
      return 'waiting';
    }
    if (phase === EPhase.GAME_OVER) {
      return 'finished';
    }
    return 'playing';
  }
}
