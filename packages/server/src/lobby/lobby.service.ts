import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ALIEN_LOBBY_OPTION_MAP } from '@seti/common/constant/alienLobby';
import { and, count, desc, eq, inArray, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Game } from '@/engine/Game.js';
import {
  createGameOptions,
  getRequiredHumanPlayers,
  getRulesPlayerCount,
  type IGameOptions,
  type IGameOptionsPatch,
  isSoloMode,
} from '@/engine/GameOptions.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import { GameRepository } from '@/persistence/repository/GameRepository.js';
import { gamePlayers } from '@/persistence/schema/players.js';
import { type TGameRow, games } from '@/persistence/schema/games.js';
import { users } from '@/persistence/schema/users.js';
import type {
  IPlayerPublicProfileResponse,
  IRoomListResponse,
  IRoomPlayer,
  IRoomResponse,
} from './dto/RoomResponseDto.js';

// Rulebook palette: each retail SETI box ships pieces in green,
// orange, purple, and white (see SE_rulebook §Components, p.2). The
// solo rival uses one of the unused colors — index 1 keeps it visually
// distinct from the human (green) and matches the rival reminder card
// imagery (orange rival pieces).
const PLAYER_COLORS = ['green', 'orange', 'purple', 'white'];
const RIVAL_DISPLAY_NAME = 'Rival Institution';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

export interface IListRoomsQuery {
  status?: string;
  page?: number;
  pageSize?: number;
}

interface IPagination {
  page: number;
  pageSize: number;
  offset: number;
}

@Injectable()
export class LobbyService {
  private readonly gameRepo: GameRepository;

  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {
    this.gameRepo = new GameRepository(db);
  }

  async createRoom(
    userId: string,
    name: string,
    playerCount: number,
    seed?: string,
    roomOptionsInput?: IGameOptionsPatch,
    visibleInLobbyInput = true,
  ): Promise<IRoomResponse> {
    const gameId = randomUUID();
    let options: Readonly<IGameOptions>;
    try {
      options = createGameOptions({
        ...(roomOptionsInput ?? {}),
        playerCount,
      });
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    await this.ensureUserExists(userId);
    const visibleInLobby = isSoloMode(options) ? visibleInLobbyInput : true;

    await this.db.insert(games).values({
      id: gameId,
      name,
      hostUserId: userId,
      status: 'waiting',
      playerCount: options.playerCount,
      currentRound: 0,
      seed: seed ?? randomUUID(),
      options,
      visibleInLobby,
    });

    await this.db.insert(gamePlayers).values({
      gameId,
      userId,
      seatIndex: 0,
      color: PLAYER_COLORS[0],
    });

    return this.getRoomById(gameId);
  }

  async listRooms(query: IListRoomsQuery = {}): Promise<IRoomListResponse> {
    const pagination = this.normalizePagination(query);
    const condition = this.combineConditions([
      eq(games.visibleInLobby, true),
      query.status ? eq(games.status, query.status) : undefined,
    ]);

    const [{ total } = { total: 0 }] = await this.db
      .select({ total: count() })
      .from(games)
      .where(condition);

    const [{ totalPlayers } = { totalPlayers: 0 }] = await this.db
      .select({ totalPlayers: count() })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .where(condition);

    const rows = await this.db
      .select()
      .from(games)
      .where(condition)
      .orderBy(desc(games.createdAt))
      .limit(pagination.pageSize)
      .offset(pagination.offset);

    return this.buildRoomListResponse(
      rows,
      pagination,
      Number(total),
      Number(totalPlayers),
    );
  }

  async listMyGames(
    userId: string,
    query: IListRoomsQuery = {},
  ): Promise<IRoomListResponse> {
    const pagination = this.normalizePagination(query);
    const condition = this.combineConditions([
      eq(gamePlayers.userId, userId),
      query.status ? eq(games.status, query.status) : undefined,
    ]);

    const [{ total } = { total: 0 }] = await this.db
      .select({ total: count() })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .where(condition);

    const matchingGameRows = await this.db
      .select({ gameId: gamePlayers.gameId })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .where(condition);
    const totalPlayers = await this.countPlayersForGames(
      matchingGameRows.map((row) => row.gameId),
    );

    const rows = await this.db
      .select({
        game: games,
      })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .where(condition)
      .orderBy(desc(games.updatedAt))
      .limit(pagination.pageSize)
      .offset(pagination.offset);

    return this.buildRoomListResponse(
      rows.map((row) => row.game as TGameRow),
      pagination,
      Number(total),
      totalPlayers,
    );
  }

  getAlienTypeMap() {
    return ALIEN_LOBBY_OPTION_MAP;
  }

  async getRoomById(gameId: string): Promise<IRoomResponse> {
    const [row] = await this.db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Room not found');
    }

    const players = await this.getPlayersForGame(gameId);

    return this.toRoomResponse(row, players);
  }

  async updateRoomOptions(
    gameId: string,
    userId: string,
    roomOptionsPatch: IGameOptionsPatch,
  ): Promise<IRoomResponse> {
    const [room] = await this.db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.hostUserId !== userId) {
      throw new ForbiddenException('Only the host can update room options');
    }

    if (room.status !== 'waiting') {
      throw new BadRequestException('Cannot update a room that has started');
    }

    const currentPlayers = await this.getPlayersForGame(gameId);

    let options: Readonly<IGameOptions>;
    try {
      options = createGameOptions({
        ...(room.options as Partial<IGameOptions>),
        ...roomOptionsPatch,
        alienModulesEnabled: {
          ...((room.options as Partial<IGameOptions>).alienModulesEnabled ??
            {}),
          ...(roomOptionsPatch.alienModulesEnabled ?? {}),
        },
      });
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    if (currentPlayers.length > getRequiredHumanPlayers(options)) {
      throw new BadRequestException(
        'Cannot reduce player count below the current number of players',
      );
    }

    await this.db
      .update(games)
      .set({
        options,
        playerCount: options.playerCount,
      })
      .where(eq(games.id, gameId));

    return this.getRoomById(gameId);
  }

  async joinRoom(gameId: string, userId: string): Promise<IRoomResponse> {
    const [room] = await this.db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status !== 'waiting') {
      throw new BadRequestException('Room is not accepting players');
    }

    await this.ensureUserExists(userId);

    const existingPlayers = await this.getPlayersForGame(gameId);

    if (existingPlayers.some((p) => p.userId === userId)) {
      throw new BadRequestException('Already in room');
    }

    const requiredHumanPlayers = getRequiredHumanPlayers(
      room.options as Partial<IGameOptions>,
    );

    if (existingPlayers.length >= requiredHumanPlayers) {
      throw new BadRequestException('Room is full');
    }

    const seatIndex = existingPlayers.length;
    const color = PLAYER_COLORS[seatIndex % PLAYER_COLORS.length];

    await this.db.insert(gamePlayers).values({
      gameId,
      userId,
      seatIndex,
      color,
    });

    return this.getRoomById(gameId);
  }

  async leaveRoom(
    gameId: string,
    userId: string,
  ): Promise<IRoomResponse | null> {
    const [room] = await this.db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status !== 'waiting') {
      throw new BadRequestException('Cannot leave a room that has started');
    }

    await this.db
      .delete(gamePlayers)
      .where(
        and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.userId, userId)),
      );

    const remainingPlayers = await this.getPlayersForGame(gameId);

    if (remainingPlayers.length === 0) {
      await this.db.delete(games).where(eq(games.id, gameId));
      return null;
    }

    if (room.hostUserId === userId) {
      await this.db
        .update(games)
        .set({ hostUserId: remainingPlayers[0].userId })
        .where(eq(games.id, gameId));
    }

    return this.getRoomById(gameId);
  }

  async deleteRoom(gameId: string, userId: string): Promise<void> {
    const [room] = await this.db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.hostUserId !== userId) {
      throw new ForbiddenException('Only the host can delete the room');
    }

    if (room.status !== 'waiting') {
      throw new BadRequestException('Cannot delete a room that has started');
    }

    await this.db.delete(games).where(eq(games.id, gameId));
  }

  async getPlayerPublicProfile(
    userId: string,
  ): Promise<IPlayerPublicProfileResponse> {
    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('Player not found');
    }

    const recentRows = await this.db
      .select({
        game: games,
        seatIndex: gamePlayers.seatIndex,
      })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .where(eq(gamePlayers.userId, userId))
      .orderBy(desc(games.updatedAt))
      .limit(5);

    const recentGames = recentRows.map((row) => ({
      id: row.game.id,
      name: row.game.name,
      status: row.game.status,
      isHost: row.game.hostUserId === userId,
      isSoloMode: isSoloMode(row.game.options as Partial<IGameOptions>),
      visibleInLobby: row.game.visibleInLobby,
      createdAt: row.game.createdAt,
      updatedAt: row.game.updatedAt,
    }));

    return {
      id: user.id,
      name: user.name,
      joinedAt: user.createdAt,
      stats: {
        gamesPlayed: recentGames.length,
        hostedGames: recentGames.filter((game) => game.isHost).length,
      },
      recentGames,
    };
  }

  async startGame(gameId: string, userId: string): Promise<IRoomResponse> {
    // Validate + acquire a row-level write lock on the games row, then
    // build the Game and write the snapshot — all inside a single
    // transaction so concurrent `POST /lobby/rooms/:id/start` calls
    // (double-click, retry from a stale tab) can't both pass the
    // status='waiting' guard and create two diverging Game instances
    // for the same gameId.
    await this.db.transaction(async (tx) => {
      const [room] = await tx
        .select()
        .from(games)
        .where(eq(games.id, gameId))
        .limit(1)
        .for('update');

      if (!room) {
        throw new NotFoundException('Room not found');
      }

      if (room.status !== 'waiting') {
        throw new BadRequestException('Game already started or finished');
      }

      if (room.hostUserId !== userId) {
        throw new ForbiddenException('Only the host can start the game');
      }

      const players = await this.getPlayersForGame(gameId, tx);

      const gameOptions = createGameOptions(
        room.options as Partial<IGameOptions>,
      );
      const requiredHumanPlayers = getRequiredHumanPlayers(gameOptions);

      if (players.length < requiredHumanPlayers) {
        throw new BadRequestException(
          `Need at least ${requiredHumanPlayers} players to start the game`,
        );
      }

      if (
        !isSoloMode(gameOptions) &&
        players.length < gameOptions.playerCount
      ) {
        throw new BadRequestException(
          `Need ${gameOptions.playerCount} players to start the game`,
        );
      }

      const identities = players.map((p) => ({
        id: p.userId,
        name: p.name,
        color: p.color,
        seatIndex: p.seatIndex,
      }));

      const seed = room.seed;
      const gameIdentities = isSoloMode(gameOptions)
        ? [
            identities[0],
            {
              id: `rival:${gameId}`,
              name: RIVAL_DISPLAY_NAME,
              color: PLAYER_COLORS[1],
              seatIndex: 1,
            },
          ]
        : identities;

      const game = Game.create(
        gameIdentities,
        { ...gameOptions, playerCount: getRulesPlayerCount(gameOptions) },
        seed,
        gameId,
      );

      await new GameRepository(tx as unknown as NodePgDatabase).startFromLobby(
        game,
      );
    });

    return this.getRoomById(gameId);
  }

  private normalizePagination(query: IListRoomsQuery): IPagination {
    const page = Math.max(1, Math.floor(query.page ?? DEFAULT_PAGE));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.floor(query.pageSize ?? DEFAULT_PAGE_SIZE)),
    );

    return {
      page,
      pageSize,
      offset: (page - 1) * pageSize,
    };
  }

  private combineConditions(
    conditions: Array<SQL | undefined>,
  ): SQL | undefined {
    const active = conditions.filter(
      (condition): condition is SQL => condition !== undefined,
    );
    if (active.length === 0) {
      return undefined;
    }
    if (active.length === 1) {
      return active[0];
    }
    return and(...active);
  }

  private async buildRoomListResponse(
    rows: TGameRow[],
    pagination: IPagination,
    total: number,
    totalPlayers: number,
  ): Promise<IRoomListResponse> {
    const items: IRoomResponse[] = [];
    for (const row of rows) {
      items.push(
        this.toRoomResponse(row, await this.getPlayersForGame(row.id)),
      );
    }

    const totalPages = Math.ceil(total / pagination.pageSize);
    return {
      items,
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPlayers,
      totalPages,
      hasMore: pagination.page < totalPages,
    };
  }

  private async countPlayersForGames(gameIds: string[]): Promise<number> {
    if (gameIds.length === 0) {
      return 0;
    }

    const [{ totalPlayers } = { totalPlayers: 0 }] = await this.db
      .select({ totalPlayers: count() })
      .from(gamePlayers)
      .where(inArray(gamePlayers.gameId, gameIds));

    return Number(totalPlayers);
  }

  private toRoomResponse(
    row: TGameRow,
    players: IRoomPlayer[],
  ): IRoomResponse {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      hostUserId: row.hostUserId,
      playerCount: row.playerCount,
      currentPlayers: players,
      options: row.options as IGameOptions,
      visibleInLobby: row.visibleInLobby ?? true,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? row.createdAt,
    };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found. Please sign in again.');
    }
  }

  private async getPlayersForGame(
    gameId: string,
    db: NodePgDatabase = this.db,
  ): Promise<IRoomPlayer[]> {
    const rows = await db
      .select({
        userId: gamePlayers.userId,
        seatIndex: gamePlayers.seatIndex,
        color: gamePlayers.color,
        name: users.name,
      })
      .from(gamePlayers)
      .innerJoin(users, eq(gamePlayers.userId, users.id))
      .where(eq(gamePlayers.gameId, gameId));

    return rows
      .sort((a, b) => a.seatIndex - b.seatIndex)
      .map((row) => ({
        userId: row.userId,
        name: row.name,
        seatIndex: row.seatIndex,
        color: row.color,
      }));
  }
}
