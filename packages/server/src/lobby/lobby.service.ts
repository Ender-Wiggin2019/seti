import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ALIEN_LOBBY_OPTION_MAP } from '@seti/common/constant/alienLobby';
import { and, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Game } from '@/engine/Game.js';
import { createGameOptions, type IGameOptions } from '@/engine/GameOptions.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import { GameRepository } from '@/persistence/repository/GameRepository.js';
import { games } from '@/persistence/schema/games.js';
import { gamePlayers } from '@/persistence/schema/players.js';
import { users } from '@/persistence/schema/users.js';
import {
  applyBehaviorFlowScenario,
  BEHAVIOR_FLOW_SCENARIO_PRESET,
} from '@/testing/behaviorFlowScenario.js';
import type { IRoomPlayer, IRoomResponse } from './dto/RoomResponseDto.js';

const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'];
type TRoomOptions = Partial<IGameOptions> & { scenarioPreset?: string };

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
    scenarioPreset?: string,
    roomOptionsInput?: Partial<IGameOptions>,
  ): Promise<IRoomResponse> {
    const gameId = randomUUID();
    const roomOptionsAny = (roomOptionsInput ?? {}) as Partial<IGameOptions> & {
      turnTimerSeconds?: number;
    };
    const normalizedRoomOptions: Partial<IGameOptions> = {
      ...roomOptionsAny,
      timerPerTurn:
        roomOptionsAny.timerPerTurn ?? roomOptionsAny.turnTimerSeconds,
    };
    let options: Readonly<IGameOptions>;
    try {
      options = createGameOptions({
        ...normalizedRoomOptions,
        playerCount,
      });
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    const roomOptions: TRoomOptions = scenarioPreset
      ? { ...options, scenarioPreset }
      : options;

    await this.db.insert(games).values({
      id: gameId,
      name,
      hostUserId: userId,
      status: 'waiting',
      playerCount,
      currentRound: 0,
      seed: seed ?? randomUUID(),
      options: roomOptions,
    });

    await this.db.insert(gamePlayers).values({
      gameId,
      userId,
      seatIndex: 0,
      color: PLAYER_COLORS[0],
    });

    return this.getRoomById(gameId);
  }

  async listRooms(status?: string): Promise<IRoomResponse[]> {
    const condition = status ? eq(games.status, status) : undefined;

    const rows = await this.db
      .select()
      .from(games)
      .where(condition)
      .orderBy(desc(games.createdAt));

    const rooms: IRoomResponse[] = [];
    for (const row of rows) {
      const players = await this.getPlayersForGame(row.id);
      rooms.push({
        id: row.id,
        name: row.name,
        status: row.status,
        hostUserId: row.hostUserId,
        playerCount: row.playerCount,
        currentPlayers: players,
        options: row.options as IGameOptions,
        createdAt: row.createdAt,
      });
    }

    return rooms;
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

    return {
      id: row.id,
      name: row.name,
      status: row.status,
      hostUserId: row.hostUserId,
      playerCount: row.playerCount,
      currentPlayers: players,
      options: row.options as IGameOptions,
      createdAt: row.createdAt,
    };
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

    const existingPlayers = await this.getPlayersForGame(gameId);

    if (existingPlayers.some((p) => p.userId === userId)) {
      throw new BadRequestException('Already in room');
    }

    if (existingPlayers.length >= room.playerCount) {
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

  async startGame(gameId: string, userId: string): Promise<IRoomResponse> {
    const [room] = await this.db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status !== 'waiting') {
      throw new BadRequestException('Game already started or finished');
    }

    if (room.hostUserId !== userId) {
      throw new ForbiddenException('Only the host can start the game');
    }

    const players = await this.getPlayersForGame(gameId);

    if (players.length < 2) {
      throw new BadRequestException(
        'Need at least 2 players to start the game',
      );
    }

    const identities = players.map((p) => ({
      id: p.userId,
      name: p.name,
      color: p.color,
      seatIndex: p.seatIndex,
    }));

    const options = room.options as TRoomOptions;
    const { scenarioPreset, ...gameOptions } = options;
    const seed = room.seed;

    const game = Game.create(
      identities,
      { ...gameOptions, playerCount: players.length },
      seed,
      gameId,
    );

    if (scenarioPreset === BEHAVIOR_FLOW_SCENARIO_PRESET) {
      applyBehaviorFlowScenario(game);
    }

    await this.gameRepo.startFromLobby(game);

    return this.getRoomById(gameId);
  }

  private async getPlayersForGame(gameId: string): Promise<IRoomPlayer[]> {
    const rows = await this.db
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
