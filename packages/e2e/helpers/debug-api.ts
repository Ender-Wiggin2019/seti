import type { APIRequestContext } from '@playwright/test';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

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
    spaceStates?: Record<
      string,
      {
        elementTypes: string[];
        elements?: Array<{ type: string; planet?: string }>;
      }
    >;
  };
  planetaryBoard?: {
    planets?: Record<string, { landingSlots?: Array<{ playerId: string }> }>;
  };
}

export interface IDebugPendingInput {
  inputId: string;
  type: string;
  options?: Array<{ id: string; label?: string }> | string[];
  cards?: Array<{ id: string }>;
}

export class DebugApi {
  constructor(private readonly request: APIRequestContext) {}

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

  async debugEndTurn(
    gameId: string,
    playerId: string,
    viewerId = playerId,
  ): Promise<IDebugGameState> {
    const res = await this.withRetry(() =>
      this.request.post(`${SERVER_URL}/debug/server/game/${gameId}/end-turn`, {
        headers: { 'Content-Type': 'application/json' },
        data: { playerId, viewerId },
      }),
    );
    if (!res.ok()) {
      throw new Error(`Debug end-turn failed: ${res.status()}`);
    }
    return res.json();
  }

  async debugSolarRotate(
    gameId: string,
    discIndex: number,
    viewerId: string,
  ): Promise<IDebugGameState> {
    const res = await this.withRetry(() =>
      this.request.post(
        `${SERVER_URL}/debug/server/game/${gameId}/solar-rotate`,
        {
          headers: { 'Content-Type': 'application/json' },
          data: { discIndex, viewerId },
        },
      ),
    );
    if (!res.ok()) {
      throw new Error(`Debug solar-rotate failed: ${res.status()}`);
    }
    return res.json();
  }

  async debugPlaceProbe(
    gameId: string,
    playerId: string,
    spaceId: string,
    viewerId = playerId,
  ): Promise<IDebugGameState> {
    const res = await this.withRetry(() =>
      this.request.post(
        `${SERVER_URL}/debug/server/game/${gameId}/place-probe`,
        {
          headers: { 'Content-Type': 'application/json' },
          data: { playerId, spaceId, viewerId },
        },
      ),
    );
    if (!res.ok()) {
      throw new Error(`Debug place-probe failed: ${res.status()}`);
    }
    return res.json();
  }

  async debugMoveProbe(
    gameId: string,
    probeId: string,
    toSpaceId: string,
    viewerId: string,
  ): Promise<IDebugGameState> {
    const res = await this.withRetry(() =>
      this.request.post(
        `${SERVER_URL}/debug/server/game/${gameId}/move-probe`,
        {
          headers: { 'Content-Type': 'application/json' },
          data: { probeId, toSpaceId, viewerId },
        },
      ),
    );
    if (!res.ok()) {
      throw new Error(`Debug move-probe failed: ${res.status()}`);
    }
    return res.json();
  }

  async debugGetPendingInput(
    gameId: string,
    playerId: string,
  ): Promise<IDebugPendingInput | null> {
    const res = await this.withRetry(() =>
      this.request.get(
        `${SERVER_URL}/debug/server/game/${gameId}/pending/${playerId}`,
      ),
    );
    if (!res.ok()) {
      throw new Error(`Debug pending-input failed: ${res.status()}`);
    }
    const bodyText = await res.text();
    if (!bodyText) {
      return null;
    }
    return JSON.parse(bodyText) as IDebugPendingInput | null;
  }
}
