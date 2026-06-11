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
  visibleInLobby: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoomListResponse {
  items: IRoomResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPlayers: number;
  totalPages: number;
  hasMore: boolean;
}

export interface IPlayerRecentGameResponse {
  id: string;
  name: string;
  status: string;
  isHost: boolean;
  isSoloMode: boolean;
  visibleInLobby: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlayerPublicProfileResponse {
  id: string;
  name: string;
  joinedAt: Date;
  stats: {
    gamesPlayed: number;
    hostedGames: number;
  };
  recentGames: IPlayerRecentGameResponse[];
}
