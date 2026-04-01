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
    const res = await this.request.post(`${SERVER_URL}/auth/register`, {
      headers: this.headers(),
      data: { name, email, password },
    });
    if (!res.ok()) throw new Error(`Register failed: ${res.status()}`);
    const body = await res.json();
    this.token = body.accessToken;
    return body;
  }

  async login(email: string, password: string): Promise<IAuthResponse> {
    const res = await this.request.post(`${SERVER_URL}/auth/login`, {
      headers: this.headers(),
      data: { email, password },
    });
    if (!res.ok()) throw new Error(`Login failed: ${res.status()}`);
    const body = await res.json();
    this.token = body.accessToken;
    return body;
  }

  async createDebugSession(): Promise<IDebugSessionResponse> {
    const res = await this.request.post(`${SERVER_URL}/debug/server/session`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok()) throw new Error(`Debug session failed: ${res.status()}`);
    return res.json();
  }

  async createRoom(name: string, playerCount: number): Promise<IRoomResponse> {
    const res = await this.request.post(`${SERVER_URL}/lobby/rooms`, {
      headers: this.headers(),
      data: { name, playerCount },
    });
    if (!res.ok()) throw new Error(`Create room failed: ${res.status()}`);
    return res.json();
  }

  async joinRoom(roomId: string): Promise<IRoomResponse> {
    const res = await this.request.post(
      `${SERVER_URL}/lobby/rooms/${roomId}/join`,
      { headers: this.headers() },
    );
    if (!res.ok()) throw new Error(`Join room failed: ${res.status()}`);
    return res.json();
  }

  async startGame(roomId: string): Promise<IRoomResponse> {
    const res = await this.request.post(
      `${SERVER_URL}/lobby/rooms/${roomId}/start`,
      { headers: this.headers() },
    );
    if (!res.ok()) throw new Error(`Start game failed: ${res.status()}`);
    return res.json();
  }
}
