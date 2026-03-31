import { httpClient } from '@/api/httpClient';
import type { IDebugServerSessionResponse } from '@/api/types';

export const debugApi = {
  createServerSession: async (): Promise<IDebugServerSessionResponse> => {
    const response = await httpClient.post<IDebugServerSessionResponse>(
      '/debug/server/session',
    );
    return response.data;
  },
};
