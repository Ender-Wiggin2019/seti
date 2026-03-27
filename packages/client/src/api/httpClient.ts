import axios from 'axios';
import { CLIENT_ENV } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';

export const httpClient = axios.create({
  baseURL: CLIENT_ENV.VITE_API_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? '';
      const isAuthFormRequest =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register');

      if (isAuthFormRequest) {
        return Promise.reject(error);
      }

      useAuthStore.getState().logout();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  },
);
