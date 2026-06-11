import { EPhase } from '@seti/common/types/protocol/enums';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { IGame } from '@/engine/IGame.js';
import { replayGameEvents } from '../replay/GameEventReplay.js';
import { games } from '../schema/games.js';
import { deserializeGame } from '../serializer/GameDeserializer.js';
import { serializeGame } from '../serializer/GameSerializer.js';
import { GameEventRepository } from './GameEventRepository.js';
import { TurnSnapshotRepository } from './TurnSnapshotRepository.js';

export type TGameStatus = 'waiting' | 'playing' | 'finished';

export class GameRepository {
  private readonly eventRepo: GameEventRepository;
  private readonly turnSnapshotRepo: TurnSnapshotRepository;

  public constructor(private readonly db: NodePgDatabase) {
    this.eventRepo = new GameEventRepository(db);
    this.turnSnapshotRepo = new TurnSnapshotRepository(db);
  }

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

    await this.saveInitialTurnSnapshot(game);
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

    await this.saveInitialTurnSnapshot(game);
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
    const snapshot = await this.turnSnapshotRepo.loadLatest(gameId);
    if (!snapshot) {
      return null;
    }
    const game = deserializeGame(snapshot.state);
    return replayGameEvents(
      game,
      await this.eventRepo.loadSince(gameId, snapshot.seq),
    );
  }

  private async saveInitialTurnSnapshot(game: IGame): Promise<void> {
    const state = serializeGame(game, 0);
    await this.turnSnapshotRepo.save({
      gameId: game.id,
      turnIndex: game.turnIndex,
      seq: game.eventLog.toArray().at(-1)?.seq ?? 0,
      playerId: game.activePlayer.id,
      round: game.round,
      state,
      interactedPlayerIds: [],
    });
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
