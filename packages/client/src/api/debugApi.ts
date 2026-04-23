import { httpClient } from '@/api/httpClient';
import type {
  IDebugReplayPresetDefinition,
  IDebugReplaySessionResponse,
  IDebugServerSessionResponse,
} from '@/api/types';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
  IPlayerInputModel,
  IPublicGameState,
} from '@/types/re-exports';

export const debugApi = {
  getReplayPresets: async (): Promise<IDebugReplayPresetDefinition[]> => {
    const response = await httpClient.get<IDebugReplayPresetDefinition[]>(
      '/debug/replay-presets',
    );
    return response.data;
  },

  createReplaySession: async (payload: {
    presetId: string;
    checkpointId: string;
    fieldValues: Record<string, string>;
  }): Promise<IDebugReplaySessionResponse> => {
    const response = await httpClient.post<IDebugReplaySessionResponse>(
      '/debug/server/replay-session',
      payload,
    );
    return response.data;
  },

  createServerSession: async (): Promise<IDebugServerSessionResponse> => {
    const response = await httpClient.post<IDebugServerSessionResponse>(
      '/debug/server/session',
    );
    return response.data;
  },

  getState: async (
    gameId: string,
    viewerId: string,
  ): Promise<IPublicGameState> => {
    const response = await httpClient.get<IPublicGameState>(
      `/debug/server/game/${gameId}/state/${viewerId}`,
    );
    return response.data;
  },

  getPendingInput: async (
    gameId: string,
    playerId: string,
  ): Promise<IPlayerInputModel | null> => {
    const response = await httpClient.get<IPlayerInputModel | null>(
      `/debug/server/game/${gameId}/pending/${playerId}`,
    );
    return response.data;
  },

  sendMainAction: async (
    gameId: string,
    playerId: string,
    action: IMainActionRequest,
    viewerId?: string,
  ): Promise<IPublicGameState> => {
    const response = await httpClient.post<IPublicGameState>(
      `/debug/server/game/${gameId}/main-action`,
      { playerId, action, viewerId },
    );
    return response.data;
  },

  sendFreeAction: async (
    gameId: string,
    playerId: string,
    action: IFreeActionRequest,
    viewerId?: string,
  ): Promise<IPublicGameState> => {
    const response = await httpClient.post<IPublicGameState>(
      `/debug/server/game/${gameId}/free-action`,
      { playerId, action, viewerId },
    );
    return response.data;
  },

  sendEndTurn: async (
    gameId: string,
    playerId: string,
    viewerId?: string,
  ): Promise<IPublicGameState> => {
    const response = await httpClient.post<IPublicGameState>(
      `/debug/server/game/${gameId}/end-turn`,
      { playerId, viewerId },
    );
    return response.data;
  },

  sendInput: async (
    gameId: string,
    playerId: string,
    inputResponse: IInputResponse,
    viewerId?: string,
  ): Promise<IPublicGameState> => {
    const response = await httpClient.post<IPublicGameState>(
      `/debug/server/game/${gameId}/input`,
      { playerId, inputResponse, viewerId },
    );
    return response.data;
  },

  // ── Solar-system sandbox ────────────────────────────────────────────────
  // Direct board mutators for data-driven view debugging. Bypass game rules.

  solarRotate: async (
    gameId: string,
    discIndex: number,
    viewerId: string,
  ): Promise<IPublicGameState> => {
    const response = await httpClient.post<IPublicGameState>(
      `/debug/server/game/${gameId}/solar-rotate`,
      { discIndex, viewerId },
    );
    return response.data;
  },

  placeProbe: async (
    gameId: string,
    playerId: string,
    spaceId: string,
    viewerId?: string,
  ): Promise<IPublicGameState> => {
    const response = await httpClient.post<IPublicGameState>(
      `/debug/server/game/${gameId}/place-probe`,
      { playerId, spaceId, viewerId },
    );
    return response.data;
  },

  moveProbe: async (
    gameId: string,
    probeId: string,
    toSpaceId: string,
    viewerId: string,
  ): Promise<IPublicGameState> => {
    const response = await httpClient.post<IPublicGameState>(
      `/debug/server/game/${gameId}/move-probe`,
      { probeId, toSpaceId, viewerId },
    );
    return response.data;
  },
};
