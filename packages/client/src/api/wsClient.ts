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

  get instance(): Socket | null {
    return this.socket;
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

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

  onState(cb: (state: IPublicGameState) => void): void {
    this.socket?.on('game:state', (data: { gameState: IPublicGameState }) =>
      cb(data.gameState),
    );
  }

  onWaiting(
    cb: (data: { playerId: string; input: IPlayerInputModel }) => void,
  ): void {
    this.socket?.on('game:waiting', cb);
  }

  onEvent(cb: (event: TGameEvent) => void): void {
    this.socket?.on('game:event', (data: { event: TGameEvent }) =>
      cb(data.event),
    );
  }

  onError(cb: (error: IErrorPayload) => void): void {
    this.socket?.on('game:error', cb);
  }

  offState(cb?: (...args: unknown[]) => void): void {
    this.socket?.off('game:state', cb);
  }

  offWaiting(cb?: (...args: unknown[]) => void): void {
    this.socket?.off('game:waiting', cb);
  }

  offEvent(cb?: (...args: unknown[]) => void): void {
    this.socket?.off('game:event', cb);
  }

  offError(cb?: (...args: unknown[]) => void): void {
    this.socket?.off('game:error', cb);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const wsClient = new WsClient();
