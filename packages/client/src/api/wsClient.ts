import { io, type Socket } from 'socket.io-client';
import { CLIENT_ENV } from '@/config/env';
import type {
  IErrorPayload,
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
  IPlayerInputModel,
  IPublicGameState,
  TGameEvent,
} from '@/types/re-exports';

type TStateSocketHandler = (data: { gameState: IPublicGameState }) => void;
type TWaitingSocketHandler = (data: {
  playerId: string;
  input: IPlayerInputModel;
}) => void;
type TEventSocketHandler = (data: { event: TGameEvent }) => void;
type TErrorSocketHandler = (error: IErrorPayload) => void;
export interface IUndoAppliedPayload {
  undoneByPlayerId: string;
  turnIndex: number;
  affectedPlayerIds: string[];
}
type TUndoAppliedHandler = (data: IUndoAppliedPayload) => void;

interface IGameSocketHandlerMap {
  'game:state': TStateSocketHandler;
  'game:waiting': TWaitingSocketHandler;
  'game:event': TEventSocketHandler;
  'game:error': TErrorSocketHandler;
  'game:undoApplied': TUndoAppliedHandler;
}

type TUntypedSocketListener = (...args: unknown[]) => void;

interface IUntypedSocket {
  on: (event: string, handler: TUntypedSocketListener) => void;
  off: (event: string, handler: TUntypedSocketListener) => void;
}

class WsClient {
  private socket: Socket | null = null;
  private connectionRefs = 0;
  private authToken: string | null = null;
  private readonly stateHandlers = new Set<TStateSocketHandler>();
  private readonly waitingHandlers = new Set<TWaitingSocketHandler>();
  private readonly eventHandlers = new Set<TEventSocketHandler>();
  private readonly errorHandlers = new Set<TErrorSocketHandler>();
  private readonly undoAppliedHandlers = new Set<TUndoAppliedHandler>();

  get instance(): Socket | null {
    return this.socket;
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  connect(token: string): Socket {
    if (this.socket && this.authToken === token) {
      return this.socket;
    }

    if (this.socket && this.authToken !== token) {
      this.disconnect();
    }

    this.authToken = token;

    this.socket = io(CLIENT_ENV.VITE_WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    this.bindRegisteredHandlers(this.socket);

    return this.socket;
  }

  retainConnection(): void {
    this.connectionRefs += 1;
  }

  releaseConnection(): void {
    this.connectionRefs = Math.max(0, this.connectionRefs - 1);
    if (this.connectionRefs === 0) {
      this.disconnect();
    }
  }

  joinGame(gameId: string): void {
    this.socket?.emit('room:join', { gameId });
  }

  leaveGame(gameId: string): void {
    this.socket?.emit('room:leave', { gameId });
  }

  sendAction(gameId: string, action: IMainActionRequest): void {
    this.socket?.emit('game:action', { gameId, action });
  }

  sendFreeAction(gameId: string, action: IFreeActionRequest): void {
    this.socket?.emit('game:freeAction', { gameId, action });
  }

  sendEndTurn(gameId: string): void {
    this.socket?.emit('game:endTurn', { gameId });
  }

  sendInput(gameId: string, inputResponse: IInputResponse): void {
    this.socket?.emit('game:input', { gameId, inputResponse });
  }

  sendUndo(gameId: string): void {
    this.socket?.emit('game:undo', { gameId });
  }

  onState(cb: (state: IPublicGameState) => void): () => void {
    return this.subscribe('game:state', this.stateHandlers, (data) =>
      cb(data.gameState),
    );
  }

  onWaiting(
    cb: (data: { playerId: string; input: IPlayerInputModel }) => void,
  ): () => void {
    return this.subscribe('game:waiting', this.waitingHandlers, cb);
  }

  onEvent(cb: (event: TGameEvent) => void): () => void {
    return this.subscribe('game:event', this.eventHandlers, (data) =>
      cb(data.event),
    );
  }

  onError(cb: (error: IErrorPayload) => void): () => void {
    return this.subscribe('game:error', this.errorHandlers, cb);
  }

  onUndoApplied(cb: TUndoAppliedHandler): () => void {
    return this.subscribe('game:undoApplied', this.undoAppliedHandlers, cb);
  }

  disconnect(): void {
    if (this.socket) {
      this.unbindRegisteredHandlers(this.socket);
      this.socket.disconnect();
    }
    this.socket = null;
    this.authToken = null;
  }

  private subscribe<TEvent extends keyof IGameSocketHandlerMap>(
    event: TEvent,
    handlers: Set<IGameSocketHandlerMap[TEvent]>,
    handler: IGameSocketHandlerMap[TEvent],
  ): () => void {
    handlers.add(handler);
    this.toUntypedSocket(this.socket)?.on(
      event,
      handler as unknown as TUntypedSocketListener,
    );

    return () => {
      handlers.delete(handler);
      this.toUntypedSocket(this.socket)?.off(
        event,
        handler as unknown as TUntypedSocketListener,
      );
    };
  }

  private bindRegisteredHandlers(socket: Socket): void {
    this.bindHandlers(socket, 'game:state', this.stateHandlers);
    this.bindHandlers(socket, 'game:waiting', this.waitingHandlers);
    this.bindHandlers(socket, 'game:event', this.eventHandlers);
    this.bindHandlers(socket, 'game:error', this.errorHandlers);
    this.bindHandlers(socket, 'game:undoApplied', this.undoAppliedHandlers);
  }

  private unbindRegisteredHandlers(socket: Socket): void {
    this.unbindHandlers(socket, 'game:state', this.stateHandlers);
    this.unbindHandlers(socket, 'game:waiting', this.waitingHandlers);
    this.unbindHandlers(socket, 'game:event', this.eventHandlers);
    this.unbindHandlers(socket, 'game:error', this.errorHandlers);
    this.unbindHandlers(socket, 'game:undoApplied', this.undoAppliedHandlers);
  }

  private bindHandlers<TEvent extends keyof IGameSocketHandlerMap>(
    socket: Socket,
    event: TEvent,
    handlers: Set<IGameSocketHandlerMap[TEvent]>,
  ): void {
    for (const handler of handlers) {
      this.toUntypedSocket(socket).on(
        event,
        handler as unknown as TUntypedSocketListener,
      );
    }
  }

  private unbindHandlers<TEvent extends keyof IGameSocketHandlerMap>(
    socket: Socket,
    event: TEvent,
    handlers: Set<IGameSocketHandlerMap[TEvent]>,
  ): void {
    for (const handler of handlers) {
      this.toUntypedSocket(socket).off(
        event,
        handler as unknown as TUntypedSocketListener,
      );
    }
  }

  private toUntypedSocket(socket: Socket): IUntypedSocket;
  private toUntypedSocket(socket: Socket | null): IUntypedSocket | null;
  private toUntypedSocket(socket: Socket | null): IUntypedSocket | null {
    return socket as unknown as IUntypedSocket | null;
  }
}

export const wsClient = new WsClient();
