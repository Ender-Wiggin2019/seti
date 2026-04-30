import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('logs in with token and user', () => {
    useAuthStore
      .getState()
      .login('jwt-token', { id: 'u1', name: 'Ada', email: 'ada@example.com' });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('jwt-token');
    expect(useAuthStore.getState().user?.name).toBe('Ada');
  });

  it('logs out and clears auth fields', () => {
    useAuthStore
      .getState()
      .login('jwt-token', { id: 'u1', name: 'Ada', email: 'ada@example.com' });
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
