import { SOLO_DIFFICULTIES } from '@seti/common/constant/solo';
import {
  DEFAULT_ALIEN_MODULES_ENABLED,
  type IGameOptions,
  type IGameOptionsPatch,
  type TAlienModulesEnabled,
} from '@seti/common/types/protocol/options';
import type { TSoloDifficulty } from '@seti/common/types/protocol/solo';
import { httpClient } from '@/api/httpClient';
import type {
  IAlienTypeOption,
  IGameOptions as IApiGameOptions,
  ICreateRoomRequest,
  IPlayerPublicProfile,
  IPlayerRecentGame,
  IRoom,
  IRoomListFilter,
  IRoomListResponse,
} from '@/api/types';

interface IServerRoomPlayer {
  userId: string;
  name: string;
  seatIndex: number;
  color: string;
}

interface IServerRoom {
  id: string;
  name: string;
  status: IRoom['status'];
  hostUserId: string | null;
  playerCount: number;
  currentPlayers: IServerRoomPlayer[];
  options: IGameOptions;
  visibleInLobby?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

interface IServerRoomListResponse {
  items: IServerRoom[];
  page: number;
  pageSize: number;
  total: number;
  totalPlayers: number;
  totalPages: number;
  hasMore: boolean;
}

interface IServerPlayerRecentGame {
  id: string;
  name: string;
  status: IRoom['status'];
  isHost: boolean;
  isSoloMode: boolean;
  visibleInLobby?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

interface IServerPlayerPublicProfile {
  id: string;
  name: string;
  joinedAt: string | Date;
  stats: {
    gamesPlayed: number;
    hostedGames: number;
  };
  recentGames: IServerPlayerRecentGame[];
}

function normalizeAlienModuleFlags(raw: unknown): TAlienModulesEnabled {
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return {
      ...DEFAULT_ALIEN_MODULES_ENABLED,
      ...(raw as Partial<TAlienModulesEnabled>),
    };
  }

  return { ...DEFAULT_ALIEN_MODULES_ENABLED };
}

function normalizeOptions(room: IServerRoom): IApiGameOptions {
  const raw = room.options;
  const rawDifficulty = raw.soloDifficulty as TSoloDifficulty | undefined;
  return {
    playerCount: raw.playerCount,
    isSoloMode: raw.isSoloMode === true,
    soloDifficulty: SOLO_DIFFICULTIES.includes(rawDifficulty ?? 1)
      ? (rawDifficulty ?? 1)
      : 1,
    alienModulesEnabled: normalizeAlienModuleFlags(raw.alienModulesEnabled),
    undoAllowed: raw.undoAllowed,
    timerPerTurn: raw.timerPerTurn,
    expansions: raw.expansions,
    spaceAgencyOptions: raw.spaceAgencyOptions,
  };
}

function toIsoString(value: string | Date | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeRoom(room: IServerRoom): IRoom {
  const players = room.currentPlayers.map((player) => ({
    id: player.userId,
    name: player.name,
    seatIndex: player.seatIndex,
    ready: true,
    isHost: player.userId === room.hostUserId,
  }));

  return {
    id: room.id,
    name: room.name,
    hostId: room.hostUserId ?? '',
    status: room.status,
    players,
    options: normalizeOptions(room),
    visibleInLobby: room.visibleInLobby !== false,
    gameId: room.status === 'playing' ? room.id : null,
    createdAt: toIsoString(room.createdAt),
    updatedAt: toIsoString(room.updatedAt ?? room.createdAt),
  };
}

function normalizeRoomListResponse(
  data: IServerRoom[] | IServerRoomListResponse,
): IRoomListResponse {
  if (Array.isArray(data)) {
    const items = data.map(normalizeRoom);
    return {
      items,
      page: 1,
      pageSize: data.length,
      total: data.length,
      totalPlayers: items.reduce((acc, room) => acc + room.players.length, 0),
      totalPages: data.length > 0 ? 1 : 0,
      hasMore: false,
    };
  }

  return {
    items: data.items.map(normalizeRoom),
    page: data.page,
    pageSize: data.pageSize,
    total: data.total,
    totalPlayers: data.totalPlayers,
    totalPages: data.totalPages,
    hasMore: data.hasMore,
  };
}

function normalizeRecentGame(game: IServerPlayerRecentGame): IPlayerRecentGame {
  return {
    id: game.id,
    name: game.name,
    status: game.status,
    isHost: game.isHost,
    isSoloMode: game.isSoloMode,
    visibleInLobby: game.visibleInLobby !== false,
    createdAt: toIsoString(game.createdAt),
    updatedAt: toIsoString(game.updatedAt ?? game.createdAt),
  };
}

function normalizePlayerPublicProfile(
  profile: IServerPlayerPublicProfile,
): IPlayerPublicProfile {
  return {
    id: profile.id,
    name: profile.name,
    joinedAt: toIsoString(profile.joinedAt),
    stats: profile.stats,
    recentGames: profile.recentGames.map(normalizeRecentGame),
  };
}

export const lobbyApi = {
  listRooms: async (filter?: IRoomListFilter): Promise<IRoomListResponse> => {
    const res = await httpClient.get<IServerRoom[] | IServerRoomListResponse>(
      '/lobby/rooms',
      {
        params: filter,
      },
    );
    return normalizeRoomListResponse(res.data);
  },

  listMyGames: async (
    filter?: IRoomListFilter,
  ): Promise<IRoomListResponse> => {
    const res = await httpClient.get<IServerRoomListResponse>(
      '/lobby/my-games',
      {
        params: filter,
      },
    );
    return normalizeRoomListResponse(res.data);
  },

  deleteRoom: async (id: string): Promise<void> => {
    await httpClient.delete(`/lobby/rooms/${id}`);
  },

  getPlayerPublicProfile: async (
    id: string,
  ): Promise<IPlayerPublicProfile> => {
    const res = await httpClient.get<IServerPlayerPublicProfile>(
      `/lobby/players/${id}/profile`,
    );
    return normalizePlayerPublicProfile(res.data);
  },

  listRoomsLegacy: async (filter?: IRoomListFilter): Promise<IRoom[]> => {
    return (await lobbyApi.listRooms(filter)).items;
  },

  createRoom: async (data: ICreateRoomRequest): Promise<IRoom> => {
    const res = await httpClient.post<IServerRoom>('/lobby/rooms', data);
    return normalizeRoom(res.data);
  },

  updateRoomOptions: async (
    id: string,
    patch: IGameOptionsPatch,
  ): Promise<IRoom> => {
    const res = await httpClient.patch<IServerRoom>(
      `/lobby/rooms/${id}/options`,
      patch,
    );
    return normalizeRoom(res.data);
  },

  getAlienTypeMap: async (): Promise<Record<string, IAlienTypeOption>> => {
    const res =
      await httpClient.get<Record<string, IAlienTypeOption>>(
        '/lobby/alien-types',
      );
    return res.data;
  },

  getRoom: async (id: string): Promise<IRoom> => {
    const res = await httpClient.get<IServerRoom>(`/lobby/rooms/${id}`);
    return normalizeRoom(res.data);
  },

  joinRoom: async (id: string): Promise<IRoom> => {
    const res = await httpClient.post<IServerRoom>(`/lobby/rooms/${id}/join`);
    return normalizeRoom(res.data);
  },

  leaveRoom: async (id: string): Promise<IRoom> => {
    const res = await httpClient.post<IServerRoom>(`/lobby/rooms/${id}/leave`);
    return normalizeRoom(res.data);
  },

  startGame: async (id: string): Promise<{ gameId: string }> => {
    const res = await httpClient.post<IServerRoom>(`/lobby/rooms/${id}/start`);
    const room = normalizeRoom(res.data);
    return { gameId: room.gameId ?? room.id };
  },
};
