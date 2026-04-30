import axios from 'axios';
import { CLIENT_ENV } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';

export const httpClient = axios.create({
  baseURL: CLIENT_ENV.VITE_API_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

function responseMessage(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const message = (data as { message?: unknown }).message;
  if (Array.isArray(message)) {
    return message.join(' ');
  }
  return typeof message === 'string' ? message : '';
}

export function shouldLogoutForUnauthorizedResponse({
  status,
  requestUrl,
  responseData,
}: {
  status?: number;
  requestUrl: string;
  responseData?: unknown;
}): boolean {
  if (status !== 401) {
    return false;
  }

  if (
    requestUrl.includes('/auth/login') ||
    requestUrl.includes('/auth/register')
  ) {
    return false;
  }

  if (requestUrl.includes('/auth/me')) {
    return true;
  }

  const message = responseMessage(responseData).toLowerCase();
  return (
    message.includes('authorization token') ||
    message.includes('expired token') ||
    message.includes('invalid token')
  );
}

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
    if (axios.isAxiosError(error)) {
      const requestUrl = error.config?.url ?? '';
      if (
        shouldLogoutForUnauthorizedResponse({
          status: error.response?.status,
          requestUrl,
          responseData: error.response?.data,
        })
      ) {
        useAuthStore.getState().logout();
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  },
);
