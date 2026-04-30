import { describe, expect, it } from 'vitest';
import { shouldLogoutForUnauthorizedResponse } from '@/api/httpClient';

describe('httpClient unauthorized handling', () => {
  it('logs out for token authentication failures', () => {
    expect(
      shouldLogoutForUnauthorizedResponse({
        status: 401,
        requestUrl: '/lobby/rooms',
        responseData: { message: 'Invalid or expired token' },
      }),
    ).toBe(true);
    expect(
      shouldLogoutForUnauthorizedResponse({
        status: 401,
        requestUrl: '/auth/me',
        responseData: { message: 'Unauthorized' },
      }),
    ).toBe(true);
  });

  it('does not log out for auth forms or business-level unauthorized errors', () => {
    expect(
      shouldLogoutForUnauthorizedResponse({
        status: 401,
        requestUrl: '/auth/login',
        responseData: { message: 'Invalid credentials' },
      }),
    ).toBe(false);
    expect(
      shouldLogoutForUnauthorizedResponse({
        status: 401,
        requestUrl: '/lobby/rooms/room-1/start',
        responseData: { code: 'UNAUTHORIZED', message: 'Only host can start' },
      }),
    ).toBe(false);
  });
});
