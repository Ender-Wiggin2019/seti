import type { IGameOptions } from '@/engine/GameOptions.js';

export interface IRoomPlayer {
  userId: string;
  name: string;
  seatIndex: number;
  color: string;
}

export interface IRoomResponse {
  id: string;
  name: string;
  status: string;
  hostUserId: string | null;
  playerCount: number;
  currentPlayers: IRoomPlayer[];
  options: IGameOptions;
  createdAt: Date;
}
