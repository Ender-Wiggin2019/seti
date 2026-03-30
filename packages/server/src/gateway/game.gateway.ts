import { Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { Server, Socket } from 'socket.io';
import { GameError } from '@/shared/errors/GameError.js';
import type { IJwtPayload } from '../auth/jwt-auth.guard.js';
import type { IActionResult } from './GameManager.js';
import { GameManager } from './GameManager.js';

function getUserId(socket: Socket): string {
  return (socket.data as { userId: string }).userId;
}

function setUserData(
  socket: Socket,
  payload: { userId: string; email: string },
): void {
  (socket.data as Record<string, string>).userId = payload.userId;
  (socket.data as Record<string, string>).email = payload.email;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GameGateway.name);
  private readonly socketToGames = new Map<string, Set<string>>();

  constructor(
    @Inject(GameManager) private readonly gameManager: GameManager,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket): void {
    try {
      const token =
        (client.handshake.auth as Record<string, string>)?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: no token`);
        client.emit('game:error', {
          code: EErrorCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
        client.disconnect();
        return;
      }

      const payload: IJwtPayload = this.jwtService.verify(token);
      setUserData(client, { userId: payload.sub, email: payload.email });
      this.socketToGames.set(client.id, new Set());
      this.logger.log(`Client ${client.id} connected as user ${payload.sub}`);
    } catch {
      this.logger.warn(`Client ${client.id} rejected: invalid token`);
      client.emit('game:error', {
        code: EErrorCode.UNAUTHORIZED,
        message: 'Invalid authentication token',
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const gameIds = this.socketToGames.get(client.id);
    if (gameIds) {
      for (const gameId of gameIds) {
        client.leave(this.roomKey(gameId));
        this.server.to(this.roomKey(gameId)).emit('room:playerLeft', {
          playerId: getUserId(client),
        });
      }
    }
    this.socketToGames.delete(client.id);
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('room:join')
  async handleRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ): Promise<void> {
    const { gameId } = data;
    const userId = getUserId(client);

    try {
      const game = await this.gameManager.getGame(gameId);
      await client.join(this.roomKey(gameId));
      this.socketToGames.get(client.id)?.add(gameId);

      const state = this.gameManager.getProjectedState(gameId, userId);
      if (state) {
        client.emit('game:state', { gameState: state });
      }

      const player = game.players.find((p) => p.id === userId);
      if (player?.waitingFor) {
        const input = player.waitingFor.toModel();
        client.emit('game:waiting', { playerId: userId, input });
      }

      client.to(this.roomKey(gameId)).emit('room:playerJoined', {
        playerId: userId,
        playerName:
          game.players.find((p) => p.id === userId)?.name ?? 'Unknown',
      });
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('room:leave')
  handleRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ): void {
    const { gameId } = data;
    client.leave(this.roomKey(gameId));
    this.socketToGames.get(client.id)?.delete(gameId);

    this.server.to(this.roomKey(gameId)).emit('room:playerLeft', {
      playerId: getUserId(client),
    });
  }

  @SubscribeMessage('game:action')
  async handleGameAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; action: IMainActionRequest },
  ): Promise<void> {
    try {
      const result = await this.gameManager.processAction(
        data.gameId,
        getUserId(client),
        data.action,
      );
      this.broadcastResult(data.gameId, result);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('game:freeAction')
  async handleFreeAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; action: IFreeActionRequest },
  ): Promise<void> {
    try {
      const result = await this.gameManager.processFreeAction(
        data.gameId,
        getUserId(client),
        data.action,
      );
      this.broadcastResult(data.gameId, result);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('game:input')
  async handleGameInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; inputResponse: IInputResponse },
  ): Promise<void> {
    try {
      const result = await this.gameManager.processInput(
        data.gameId,
        getUserId(client),
        data.inputResponse,
      );
      this.broadcastResult(data.gameId, result);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  private broadcastResult(gameId: string, result: IActionResult): void {
    const roomKey = this.roomKey(gameId);

    for (const [playerId, state] of result.states) {
      const sockets = this.getPlayerSockets(gameId, playerId);
      for (const socket of sockets) {
        socket.emit('game:state', { gameState: state });
      }
    }

    for (const pending of result.pendingInputs) {
      const sockets = this.getPlayerSockets(gameId, pending.playerId);
      for (const socket of sockets) {
        socket.emit('game:waiting', {
          playerId: pending.playerId,
          input: pending.input,
        });
      }
    }

    for (const event of result.events) {
      this.server.to(roomKey).emit('game:event', { event });
    }
  }

  private getPlayerSockets(gameId: string, playerId: string): Socket[] {
    const roomKey = this.roomKey(gameId);
    const room = this.server.sockets.adapter.rooms.get(roomKey);
    if (!room) {
      return [];
    }

    const sockets: Socket[] = [];
    for (const socketId of room) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket && getUserId(socket) === playerId) {
        sockets.push(socket);
      }
    }
    return sockets;
  }

  private emitError(client: Socket, err: unknown): void {
    if (err instanceof GameError) {
      client.emit('game:error', {
        code: err.code,
        message: err.message,
        details: err.details,
      });
    } else {
      const message =
        err instanceof Error ? err.message : 'Internal server error';
      client.emit('game:error', {
        code: EErrorCode.INTERNAL_SERVER_ERROR,
        message,
      });
    }
  }

  private roomKey(gameId: string): string {
    return `game:${gameId}`;
  }
}
