import { io, type Socket } from 'socket.io-client';

const WS_URL = process.env.WS_URL ?? 'http://localhost:3000';

export interface IWsGameState {
  currentPlayerId: string;
  startPlayerId?: string;
  round: number;
  phase: string;
  players: Array<{
    playerId: string;
    playerName: string;
    color: string;
    score: number;
    hand?: Array<{ id: string } | string>;
    handSize: number;
    playedMissions?: Array<{ id: string } | string>;
    techs?: string[];
    movementPoints?: number;
    probesInSpace?: number;
    resources: {
      credit?: number;
      credits?: number;
      energy?: number;
      publicity?: number;
      data?: number;
    };
    computer?: {
      columns?: Array<{
        topFilled?: boolean;
        techId?: string | null;
      }>;
    };
    passed?: boolean;
  }>;
  solarSystem: {
    probes: Array<{ playerId: string; spaceId: string }>;
    adjacency: Record<string, string[]>;
    discs?: Array<{ discIndex: number; angle: number }>;
    spaceStates?: Record<
      string,
      {
        spaceId: string;
        hasPublicityIcon: boolean;
        elementTypes: string[];
      }
    >;
  };
  cardRow: Array<{ id: string } | string>;
  endOfRoundStacks: Array<Array<{ id: string } | string>>;
  sectors: Array<{
    id: string;
    color: string;
    signals?: Array<{ type: 'data' | 'player'; playerId?: string }>;
  }>;
  planetaryBoard?: {
    planets?: Record<
      string,
      {
        landingSlots?: Array<{ playerId: string }>;
      }
    >;
  };
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
  private _connected = false;

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
  get connected(): boolean {
    return this._connected;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
      });

      this.socket.on('connect', () => {
        this._connected = true;
        resolve();
      });
      this.socket.on('connect_error', (err) => reject(err));
      this.socket.on('disconnect', () => {
        this._connected = false;
      });

      this.socket.on('game:state', (data: { gameState: IWsGameState }) => {
        this._gameState = data.gameState;
        // Clear stale pending input snapshot; if new input is needed
        // server will emit a fresh `game:waiting` immediately after.
        this._pendingInput = null;
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
    this._connected = false;
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
      let settled = false;
      const onState = (state: IWsGameState) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(state);
      };

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.stateWaiters = this.stateWaiters.filter(
          (waiter) => waiter !== onState,
        );
        reject(new Error('Timed out waiting for game:state'));
      }, timeoutMs);

      this.stateWaiters.push(onState);
    });
  }

  /**
   * Wait for the next `game:waiting` event, with a timeout.
   */
  waitForInput(timeoutMs = 5_000): Promise<IWsPendingInput> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const onInput = (input: IWsPendingInput) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(input);
      };

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.inputWaiters = this.inputWaiters.filter(
          (waiter) => waiter !== onInput,
        );
        reject(new Error('Timed out waiting for game:waiting'));
      }, timeoutMs);

      this.inputWaiters.push(onInput);
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
