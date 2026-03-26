import { httpClient } from '@/api/httpClient';
import type { ICreateRoomRequest, IRoom, IRoomListFilter } from '@/api/types';

export const lobbyApi = {
  listRooms: async (filter?: IRoomListFilter): Promise<IRoom[]> => {
    const res = await httpClient.get<IRoom[]>('/lobby/rooms', {
      params: filter,
    });
    return res.data;
  },

  createRoom: async (data: ICreateRoomRequest): Promise<IRoom> => {
    const res = await httpClient.post<IRoom>('/lobby/rooms', data);
    return res.data;
  },

  getRoom: async (id: string): Promise<IRoom> => {
    const res = await httpClient.get<IRoom>(`/lobby/rooms/${id}`);
    return res.data;
  },

  joinRoom: async (id: string): Promise<IRoom> => {
    const res = await httpClient.post<IRoom>(`/lobby/rooms/${id}/join`);
    return res.data;
  },

  leaveRoom: async (id: string): Promise<IRoom> => {
    const res = await httpClient.post<IRoom>(`/lobby/rooms/${id}/leave`);
    return res.data;
  },

  startGame: async (id: string): Promise<{ gameId: string }> => {
    const res = await httpClient.post<{ gameId: string }>(
      `/lobby/rooms/${id}/start`,
    );
    return res.data;
  },
};
