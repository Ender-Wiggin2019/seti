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
import {
  EFreeAction,
  EMainAction,
  EPhase,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type IPlayerInputModel,
} from '@seti/common/types/protocol/playerInput';
import type { Server, Socket } from 'socket.io';
import { DebugSessionRegistry } from '@/debug/DebugSessionRegistry.js';
import { GameError } from '@/shared/errors/GameError.js';
import type { IJwtPayload } from '../auth/jwt-auth.guard.js';
import type { IActionResult, IUndoResult } from './GameManager.js';
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
  private static readonly BOT_MAIN_ACTIONS: ReadonlyArray<EMainAction> = [
    EMainAction.LAUNCH_PROBE,
    EMainAction.RESEARCH_TECH,
    EMainAction.LAND,
    EMainAction.SCAN,
    EMainAction.ORBIT,
    EMainAction.PASS,
  ];

  constructor(
    @Inject(GameManager) private readonly gameManager: GameManager,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(DebugSessionRegistry)
    private readonly debugSessionRegistry: DebugSessionRegistry,
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
      await this.runDebugBots(gameId);
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
      await this.runDebugBots(data.gameId);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('game:endTurn')
  async handleEndTurn(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ): Promise<void> {
    try {
      const result = await this.gameManager.processEndTurn(
        data.gameId,
        getUserId(client),
      );
      this.broadcastResult(data.gameId, result);
      await this.runDebugBots(data.gameId);
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
      await this.runDebugBots(data.gameId);
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
      await this.runDebugBots(data.gameId);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('game:undo')
  async handleGameUndo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ): Promise<void> {
    try {
      const result = await this.gameManager.undoToTurnStart(
        data.gameId,
        getUserId(client),
      );
      this.broadcastUndoResult(data.gameId, result);
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

  private broadcastUndoResult(gameId: string, result: IUndoResult): void {
    const roomKey = this.roomKey(gameId);

    for (const [playerId, state] of result.states) {
      const sockets = this.getPlayerSockets(gameId, playerId);
      for (const socket of sockets) {
        socket.emit('game:state', { gameState: state });
      }
    }

    this.server.to(roomKey).emit('game:undoApplied', {
      undoneByPlayerId: result.undoneByPlayerId,
      turnIndex: result.turnIndex,
      affectedPlayerIds: result.interactedPlayerIds,
    });
  }

  private getPlayerSockets(gameId: string, playerId: string): Socket[] {
    const roomKey = this.roomKey(gameId);
    const nsp = this.server as unknown as import('socket.io').Namespace;
    const adapterRooms = nsp.adapter?.rooms;
    if (!adapterRooms) {
      return [];
    }
    const room = adapterRooms.get(roomKey);
    if (!room) {
      return [];
    }

    const sockets: Socket[] = [];
    for (const socketId of room) {
      const socket = nsp.sockets.get(socketId);
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

  private async runDebugBots(gameId: string): Promise<void> {
    if (!this.debugSessionRegistry.isDebugGame(gameId)) {
      return;
    }

    for (let step = 0; step < 20; step += 1) {
      const game = await this.gameManager.getGame(gameId);
      const botPlayerId = game.activePlayer.id;
      if (!this.debugSessionRegistry.isBotPlayer(gameId, botPlayerId)) {
        return;
      }

      const inputModel = game.activePlayer.waitingFor?.toModel();
      if (inputModel) {
        const botResponse = this.pickRandomInputResponse(inputModel);
        if (!botResponse) {
          return;
        }
        const inputResult = await this.gameManager.processInput(
          gameId,
          botPlayerId,
          botResponse,
        );
        this.broadcastResult(gameId, inputResult);
        continue;
      }

      if (Math.random() < 0.6) {
        const movementResult = await this.tryBotMovement(gameId, botPlayerId);
        if (movementResult) {
          this.broadcastResult(gameId, movementResult);
        }
      }

      if (game.phase === EPhase.AWAIT_END_TURN) {
        const endTurnResult = await this.gameManager.processEndTurn(
          gameId,
          botPlayerId,
        );
        this.broadcastResult(gameId, endTurnResult);
        continue;
      }

      const mainActionResult = await this.tryBotMainAction(gameId, botPlayerId);
      if (!mainActionResult) {
        return;
      }
      this.broadcastResult(gameId, mainActionResult);
    }
  }

  private async tryBotMovement(
    gameId: string,
    botPlayerId: string,
  ): Promise<IActionResult | null> {
    const state = this.gameManager.getProjectedState(gameId, botPlayerId);
    if (!state) {
      return null;
    }

    const botProbeSpaces = state.solarSystem.probes
      .filter((probe) => probe.playerId === botPlayerId)
      .map((probe) => probe.spaceId);
    const shuffledSpaces = this.shuffle(botProbeSpaces);

    for (const fromSpaceId of shuffledSpaces) {
      const neighbors = this.shuffle(
        state.solarSystem.adjacency[fromSpaceId] ?? [],
      );
      for (const toSpaceId of neighbors) {
        try {
          return await this.gameManager.processFreeAction(gameId, botPlayerId, {
            type: EFreeAction.MOVEMENT,
            path: [fromSpaceId, toSpaceId],
          });
        } catch {
          // Try another random path.
        }
      }
    }

    return null;
  }

  private async tryBotMainAction(
    gameId: string,
    botPlayerId: string,
  ): Promise<IActionResult | null> {
    const candidateActions = this.shuffle([
      ...GameGateway.BOT_MAIN_ACTIONS,
    ] as EMainAction[]);
    for (const actionType of candidateActions) {
      try {
        return await this.gameManager.processAction(gameId, botPlayerId, {
          type: actionType,
        });
      } catch {
        // Try next action candidate.
      }
    }
    return null;
  }

  private pickRandomInputResponse(
    model: IPlayerInputModel,
  ): IInputResponse | null {
    switch (model.type) {
      case EPlayerInputType.OPTION: {
        if (model.options.length === 0) {
          return null;
        }
        const option = this.pickRandom(model.options);
        return option
          ? { type: EPlayerInputType.OPTION, optionId: option.id }
          : null;
      }
      case EPlayerInputType.CARD: {
        const card = this.pickRandom(model.cards);
        if (!card) {
          return null;
        }
        return { type: EPlayerInputType.CARD, cardIds: [card.id] };
      }
      case EPlayerInputType.SECTOR: {
        const sector = this.pickRandom(model.options);
        return sector ? { type: EPlayerInputType.SECTOR, sector } : null;
      }
      case EPlayerInputType.PLANET: {
        const planet = this.pickRandom(model.options);
        return planet ? { type: EPlayerInputType.PLANET, planet } : null;
      }
      case EPlayerInputType.TECH: {
        const tech = this.pickRandom(model.options);
        return tech ? { type: EPlayerInputType.TECH, tech } : null;
      }
      case EPlayerInputType.GOLD_TILE: {
        const tileId = this.pickRandom(model.options);
        return tileId ? { type: EPlayerInputType.GOLD_TILE, tileId } : null;
      }
      case EPlayerInputType.RESOURCE: {
        const resource = this.pickRandom(model.options);
        return resource ? { type: EPlayerInputType.RESOURCE, resource } : null;
      }
      case EPlayerInputType.TRACE: {
        const trace = this.pickRandom(model.options);
        return trace ? { type: EPlayerInputType.TRACE, trace } : null;
      }
      case EPlayerInputType.END_OF_ROUND: {
        const card = this.pickRandom(model.cards);
        return card
          ? { type: EPlayerInputType.END_OF_ROUND, cardId: card.id }
          : null;
      }
      case EPlayerInputType.OR: {
        if (model.options.length === 0) {
          return null;
        }
        const index = Math.floor(Math.random() * model.options.length);
        const response = this.pickRandomInputResponse(model.options[index]);
        if (!response) {
          return null;
        }
        return { type: EPlayerInputType.OR, index, response };
      }
      case EPlayerInputType.AND: {
        const responses = model.options
          .map((item) => this.pickRandomInputResponse(item))
          .filter((response): response is IInputResponse => response !== null);
        if (responses.length !== model.options.length) {
          return null;
        }
        return { type: EPlayerInputType.AND, responses };
      }
      default:
        return null;
    }
  }

  private pickRandom<TValue>(items: TValue[]): TValue | null {
    if (items.length === 0) {
      return null;
    }
    const index = Math.floor(Math.random() * items.length);
    return items[index] ?? null;
  }

  private shuffle<TValue>(items: TValue[]): TValue[] {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const rand = Math.floor(Math.random() * (index + 1));
      [next[index], next[rand]] = [next[rand], next[index]];
    }
    return next;
  }
}
