import { httpClient } from '@/api/httpClient';
import type {
  IAuthUser,
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IRegisterResponse,
  IUpdateProfileRequest,
} from '@/api/types';

export const authApi = {
  login: async (data: ILoginRequest): Promise<ILoginResponse> => {
    const res = await httpClient.post<ILoginResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: IRegisterRequest): Promise<IRegisterResponse> => {
    const res = await httpClient.post<IRegisterResponse>(
      '/auth/register',
      data,
    );
    return res.data;
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
