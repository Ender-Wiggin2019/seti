import { httpClient } from '@/api/httpClient';
import type { ICreateRoomRequest, IRoom, IRoomListFilter } from '@/api/types';

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
  playerCount?: number;
  currentPlayers?: IServerRoomPlayer[];
  options?: IRoom['options'];
  createdAt?: string | Date;
}

function toIsoString(value: string | Date | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeRoom(room: IServerRoom): IRoom {
  const players = (room.currentPlayers ?? []).map((player) => ({
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
    options:
      room.options ??
      ({
        playerCount: room.playerCount ?? Math.max(players.length, 2),
        alienModulesEnabled: false,
        undoAllowed: true,
        turnTimerSeconds: 0,
      } as const),
    gameId: room.status === 'playing' ? room.id : null,
    createdAt: toIsoString(room.createdAt),
    updatedAt: toIsoString(room.createdAt),
  };
}

export const lobbyApi = {
  listRooms: async (filter?: IRoomListFilter): Promise<IRoom[]> => {
    const res = await httpClient.get<IServerRoom[]>('/lobby/rooms', {
      params: filter,
    });
    return res.data.map(normalizeRoom);
  },

  createRoom: async (data: ICreateRoomRequest): Promise<IRoom> => {
    const res = await httpClient.post<IServerRoom>('/lobby/rooms', data);
    return normalizeRoom(res.data);
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
