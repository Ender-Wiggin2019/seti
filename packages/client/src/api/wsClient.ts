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

class WsClient {
  private socket: Socket | null = null;
  private connectionRefs = 0;
  private authToken: string | null = null;

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

  sendInput(gameId: string, inputResponse: IInputResponse): void {
    this.socket?.emit('game:input', { gameId, inputResponse });
  }

  onState(cb: (state: IPublicGameState) => void): () => void {
    const handler = (data: { gameState: IPublicGameState }) =>
      cb(data.gameState);
    this.socket?.on('game:state', handler);
    return () => {
      this.socket?.off('game:state', handler);
    };
  }

  onWaiting(
    cb: (data: { playerId: string; input: IPlayerInputModel }) => void,
  ): () => void {
    this.socket?.on('game:waiting', cb);
    return () => {
      this.socket?.off('game:waiting', cb);
    };
  }

  onEvent(cb: (event: TGameEvent) => void): () => void {
    const handler = (data: { event: TGameEvent }) => cb(data.event);
    this.socket?.on('game:event', handler);
    return () => {
      this.socket?.off('game:event', handler);
    };
  }

  onError(cb: (error: IErrorPayload) => void): () => void {
    this.socket?.on('game:error', cb);
    return () => {
      this.socket?.off('game:error', cb);
    };
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.authToken = null;
  }
}

export const wsClient = new WsClient();
