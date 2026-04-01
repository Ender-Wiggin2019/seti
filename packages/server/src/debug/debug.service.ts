import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { IJwtPayload } from '@/auth/jwt-auth.guard.js';
import { Game } from '@/engine/Game.js';
import { createGameOptions } from '@/engine/GameOptions.js';
import type { IGamePlayerIdentity } from '@/engine/IGame.js';
import { GameManager } from '@/gateway/GameManager.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import { GameRepository } from '@/persistence/repository/GameRepository.js';
import { DebugSessionRegistry } from './DebugSessionRegistry.js';

interface IDebugAuthUser {
  id: string;
  name: string;
  email: string;
}

export interface IDebugServerSessionResponse {
  gameId: string;
  accessToken: string;
  user: IDebugAuthUser;
}

const DEBUG_PLAYER_BLUEPRINTS: ReadonlyArray<{
  name: string;
  color: string;
}> = [
  { name: 'Commander Ada', color: 'red' },
  { name: 'Bot Vega', color: 'blue' },
];

@Injectable()
export class DebugService {
  private readonly logger = new Logger(DebugService.name);
  private readonly gameRepository: GameRepository;

  constructor(
    @Inject(DRIZZLE_DB) db: NodePgDatabase,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(GameManager) private readonly gameManager: GameManager,
    @Inject(DebugSessionRegistry)
    private readonly debugSessionRegistry: DebugSessionRegistry,
  ) {
    this.gameRepository = new GameRepository(db);
  }

  async createServerSession(): Promise<IDebugServerSessionResponse> {
    const gameId = randomUUID();
    const seed = randomUUID();
    const playerCount = DEBUG_PLAYER_BLUEPRINTS.length;
    const players: IGamePlayerIdentity[] = DEBUG_PLAYER_BLUEPRINTS.map(
      (blueprint, seatIndex) => ({
        id: randomUUID(),
        name: blueprint.name,
        color: blueprint.color,
        seatIndex,
      }),
    );

    const gameOptions = createGameOptions({ playerCount });
    const game = Game.create(players, gameOptions, seed, gameId);
    const humanPlayer = players[0];
    const botPlayerIds = players.slice(1).map((player) => player.id);
    this.debugSessionRegistry.register(gameId, humanPlayer.id, botPlayerIds);
    this.gameManager.registerGame(game);
    try {
      await this.gameRepository.create(game);
    } catch (error) {
      this.logger.warn(
        `Failed to persist debug game ${gameId}, continuing with in-memory mode`,
      );
      this.logger.debug(error);
    }

    const viewerEmail = `${humanPlayer.id}@debug.local`;
    const payload: IJwtPayload = {
      sub: humanPlayer.id,
      email: viewerEmail,
    };

    return {
      gameId,
      accessToken: this.jwtService.sign(payload, { expiresIn: '2h' }),
      user: {
        id: humanPlayer.id,
        name: humanPlayer.name,
        email: viewerEmail,
      },
    };
  }
}
