import type { APIRequestContext } from '@playwright/test';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

export async function waitForServerReady(
  request: APIRequestContext,
): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const res = await request.get(`${SERVER_URL}/auth/me`);
      if (res.status() === 401) {
        return;
      }
    } catch {
      // Ignore boot-time network failures and retry.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error('Server did not become ready in time');
}
