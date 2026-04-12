import { httpClient } from '@/api/httpClient';
import type {
  IAuthUser,
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IRegisterResponse,
  IUpdateProfileRequest,
} from '@/api/types';

interface IServerAuthResponse {
  token?: string;
  accessToken?: string;
  user: IAuthUser;
}

function normalizeAuthResponse(data: IServerAuthResponse): ILoginResponse {
  const token = data.token ?? data.accessToken;
  if (!token) {
    throw new Error('Invalid auth response: missing token');
  }
  return { token, user: data.user };
}

export const authApi = {
  login: async (data: ILoginRequest): Promise<ILoginResponse> => {
    const res = await httpClient.post<IServerAuthResponse>('/auth/login', data);
    return normalizeAuthResponse(res.data);
  },

  register: async (data: IRegisterRequest): Promise<IRegisterResponse> => {
    const res = await httpClient.post<IServerAuthResponse>(
      '/auth/register',
      data,
    );
    return normalizeAuthResponse(res.data);
  },

  getMe: async (): Promise<IAuthUser> => {
    const res = await httpClient.get<IAuthUser>('/auth/me');
    return res.data;
  },

  updateMe: async (data: IUpdateProfileRequest): Promise<IAuthUser> => {
    const res = await httpClient.put<IAuthUser>('/auth/me', data);
    return res.data;
  },
};
