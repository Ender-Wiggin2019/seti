import type { APIRequestContext } from '@playwright/test';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

export interface IAuthResponse {
  accessToken: string;
  user: { id: string; name: string; email: string };
}

export interface IDebugSessionResponse {
  gameId: string;
  accessToken: string;
  user: { id: string; name: string; email: string };
}

export interface IBehaviorFlowSessionResponse {
  gameId: string;
  seed: string;
  players: Array<{
    accessToken: string;
    user: { id: string; name: string; email: string };
  }>;
}

export interface IDebugGameStatePlayer {
  playerId: string;
  hand?: Array<{ id: string } | string>;
  resources: Record<string, number | undefined>;
  probesInSpace?: number;
}

export interface IDebugGameState {
  currentPlayerId: string;
  round: number;
  phase: string;
  players: IDebugGameStatePlayer[];
  solarSystem: {
    adjacency: Record<string, string[]>;
    spaceStates?: Record<string, { elementTypes: string[] }>;
  };
  planetaryBoard?: {
    planets?: Record<string, { landingSlots?: Array<{ playerId: string }> }>;
  };
}

export interface IRoomResponse {
  id: string;
  name: string;
  status: string;
  hostUserId: string | null;
  playerCount: number;
  currentPlayers: Array<{
    userId: string;
    name: string;
    seatIndex: number;
    color: string;
  }>;
}

export class SetiApi {
  constructor(
    private readonly request: APIRequestContext,
    private token: string | null = null,
  ) {}

  private isRetryableNetworkError(error: unknown): boolean {
    const message = String(error);
    return (
      message.includes('ECONNREFUSED') ||
      message.includes('ECONNRESET') ||
      message.includes('socket hang up')
    );
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (!this.isRetryableNetworkError(error) || attempt === 7) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    throw lastError;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  setToken(token: string): void {
    this.token = token;
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<IAuthResponse> {
    const res = await this.withRetry(() =>
      this.request.post(`${SERVER_URL}/auth/register`, {
        headers: this.headers(),
        data: { name, email, password },
      }),
    );
    if (!res.ok()) throw new Error(`Register failed: ${res.status()}`);
    const body = await res.json();
    this.token = body.accessToken;
    return body;
  }

  async login(email: string, password: string): Promise<IAuthResponse> {
    const res = await this.withRetry(() =>
      this.request.post(`${SERVER_URL}/auth/login`, {
        headers: this.headers(),
        data: { email, password },
      }),
    );
    if (!res.ok()) throw new Error(`Login failed: ${res.status()}`);
    const body = await res.json();
    this.token = body.accessToken;
    return body;
  }

  async createDebugSession(): Promise<IDebugSessionResponse> {
    const res = await this.withRetry(() =>
      this.request.post(`${SERVER_URL}/debug/server/session`, {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    if (!res.ok()) throw new Error(`Debug session failed: ${res.status()}`);
    return res.json();
  }

  async createBehaviorFlowSession(): Promise<IBehaviorFlowSessionResponse> {
    const res = await this.withRetry(() =>
      this.request.post(`${SERVER_URL}/debug/server/behavior-flow`, {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    if (!res.ok()) {
      throw new Error(`Behavior-flow session failed: ${res.status()}`);
    }
    return res.json();
  }

  async debugGetState(
    gameId: string,
    viewerId: string,
  ): Promise<IDebugGameState> {
    const res = await this.withRetry(() =>
      this.request.get(
        `${SERVER_URL}/debug/server/game/${gameId}/state/${viewerId}`,
      ),
    );
    if (!res.ok()) {
      throw new Error(`Debug get-state failed: ${res.status()}`);
    }
    return res.json();
  }

  async debugMainAction(
    gameId: string,
    playerId: string,
    action: Record<string, unknown>,
    viewerId = playerId,
  ): Promise<IDebugGameState> {
    const res = await this.withRetry(() =>
      this.request.post(
        `${SERVER_URL}/debug/server/game/${gameId}/main-action`,
        {
          headers: { 'Content-Type': 'application/json' },
          data: { playerId, action, viewerId },
        },
      ),
    );
    if (!res.ok()) {
      throw new Error(`Debug main-action failed: ${res.status()}`);
    }
    return res.json();
  }

  async debugFreeAction(
    gameId: string,
    playerId: string,
    action: Record<string, unknown>,
    viewerId = playerId,
  ): Promise<IDebugGameState> {
    const res = await this.withRetry(() =>
      this.request.post(
        `${SERVER_URL}/debug/server/game/${gameId}/free-action`,
        {
          headers: { 'Content-Type': 'application/json' },
          data: { playerId, action, viewerId },
        },
      ),
    );
    if (!res.ok()) {
      throw new Error(`Debug free-action failed: ${res.status()}`);
    }
    return res.json();
  }

  async debugInput(
    gameId: string,
    playerId: string,
    inputResponse: Record<string, unknown>,
    viewerId = playerId,
  ): Promise<IDebugGameState> {
    const res = await this.withRetry(() =>
      this.request.post(`${SERVER_URL}/debug/server/game/${gameId}/input`, {
        headers: { 'Content-Type': 'application/json' },
        data: { playerId, inputResponse, viewerId },
      }),
    );
    if (!res.ok()) {
      throw new Error(`Debug input failed: ${res.status()}`);
    }
    return res.json();
  }

  async createRoom(name: string, playerCount: number): Promise<IRoomResponse> {
    const res = await this.withRetry(() =>
      this.request.post(`${SERVER_URL}/lobby/rooms`, {
        headers: this.headers(),
        data: { name, playerCount },
      }),
    );
    if (!res.ok()) throw new Error(`Create room failed: ${res.status()}`);
    return res.json();
  }

  async joinRoom(roomId: string): Promise<IRoomResponse> {
    const res = await this.withRetry(() =>
      this.request.post(`${SERVER_URL}/lobby/rooms/${roomId}/join`, {
        headers: this.headers(),
      }),
    );
    if (!res.ok()) throw new Error(`Join room failed: ${res.status()}`);
    return res.json();
  }

  async startGame(roomId: string): Promise<IRoomResponse> {
    const res = await this.withRetry(() =>
      this.request.post(`${SERVER_URL}/lobby/rooms/${roomId}/start`, {
        headers: this.headers(),
      }),
    );
    if (!res.ok()) throw new Error(`Start game failed: ${res.status()}`);
    return res.json();
  }
}
