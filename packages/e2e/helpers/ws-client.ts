import { io, type Socket } from 'socket.io-client';

const WS_URL = process.env.WS_URL ?? 'http://localhost:3000';

export interface IWsGameState {
  currentPlayerId: string;
  round: number;
  phase: string;
  players: Array<{
    playerId: string;
    playerName: string;
    color: string;
    score: number;
    hand: Array<{ id: string }>;
    handSize: number;
    resources: {
      credits: number;
      energy: number;
      publicity: number;
      data: number;
    };
  }>;
  solarSystem: {
    probes: Array<{ playerId: string; spaceId: string }>;
    adjacency: Record<string, string[]>;
  };
  cardRow: Array<{ id: string }>;
  endOfRoundStacks: Array<Array<{ id: string }>>;
  sectors: Array<{ id: string; color: string }>;
  [key: string]: unknown;
}

export interface IWsPendingInput {
  playerId: string;
  input: {
    type: string;
    options?: Array<{ id: string; label?: string }>;
    cards?: Array<{ id: string }>;
    [key: string]: unknown;
  };
}

/**
 * Thin Socket.IO wrapper for E2E tests.
 * Mirrors the client wsClient events but exposes raw promise-based APIs.
 */
export class WsTestClient {
  private socket: Socket | null = null;
  private _gameState: IWsGameState | null = null;
  private _pendingInput: IWsPendingInput | null = null;
  private _events: unknown[] = [];
  private _errors: unknown[] = [];

  private stateWaiters: Array<(state: IWsGameState) => void> = [];
  private inputWaiters: Array<(input: IWsPendingInput) => void> = [];

  get gameState(): IWsGameState | null {
    return this._gameState;
  }
  get pendingInput(): IWsPendingInput | null {
    return this._pendingInput;
  }
  get events(): unknown[] {
    return this._events;
  }
  get errors(): unknown[] {
    return this._errors;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
      });

      this.socket.on('connect', () => resolve());
      this.socket.on('connect_error', (err) => reject(err));

      this.socket.on('game:state', (data: { gameState: IWsGameState }) => {
        this._gameState = data.gameState;
        const waiter = this.stateWaiters.shift();
        if (waiter) waiter(data.gameState);
      });

      this.socket.on('game:waiting', (data: IWsPendingInput) => {
        this._pendingInput = data;
        const waiter = this.inputWaiters.shift();
        if (waiter) waiter(data);
      });

      this.socket.on('game:event', (data: unknown) => {
        this._events.push(data);
      });

      this.socket.on('game:error', (data: unknown) => {
        this._errors.push(data);
      });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinGame(gameId: string): void {
    this.socket?.emit('room:join', { gameId });
  }

  leaveGame(gameId: string): void {
    this.socket?.emit('room:leave', { gameId });
  }

  sendAction(gameId: string, action: Record<string, unknown>): void {
    this.socket?.emit('game:action', { gameId, action });
  }

  sendFreeAction(gameId: string, action: Record<string, unknown>): void {
    this.socket?.emit('game:freeAction', { gameId, action });
  }

  sendInput(gameId: string, inputResponse: Record<string, unknown>): void {
    this.socket?.emit('game:input', { gameId, inputResponse });
  }

  /**
   * Wait for the next `game:state` event, with a timeout.
   */
  waitForState(timeoutMs = 5_000): Promise<IWsGameState> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timed out waiting for game:state'));
      }, timeoutMs);

      this.stateWaiters.push((state) => {
        clearTimeout(timer);
        resolve(state);
      });
    });
  }

  /**
   * Wait for the next `game:waiting` event, with a timeout.
   */
  waitForInput(timeoutMs = 5_000): Promise<IWsPendingInput> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timed out waiting for game:waiting'));
      }, timeoutMs);

      this.inputWaiters.push((input) => {
        clearTimeout(timer);
        resolve(input);
      });
    });
  }

  /**
   * Wait for game state to satisfy a predicate.
   */
  async waitForCondition(
    predicate: (state: IWsGameState) => boolean,
    timeoutMs = 10_000,
  ): Promise<IWsGameState> {
    if (this._gameState && predicate(this._gameState)) {
      return this._gameState;
    }
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const state = await this.waitForState(deadline - Date.now());
      if (predicate(state)) return state;
    }
    throw new Error('Timed out waiting for condition');
  }
}
