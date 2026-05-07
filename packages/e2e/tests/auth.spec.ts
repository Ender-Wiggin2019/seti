import { expect, test, type APIRequestContext } from '@playwright/test';
import { SetiApi } from '../helpers/api';
import { waitForServerReady } from '../helpers/server-ready';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

/**
 * ══════════════════════════════════════════════════════════════════════
 * Auth E2E Tests
 * Covers: Registration, login, protected route redirection, profile.
 * ══════════════════════════════════════════════════════════════════════
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ request }) => {
    await waitForServerReady(request);
  });

  // ── API-level auth tests ───────────────────────────────────

  function uniqueEmail(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
  }

  async function registerApiUser(
    request: APIRequestContext,
    prefix: string,
  ): Promise<{ api: SetiApi; email: string; accessToken: string }> {
    const api = new SetiApi(request);
    const email = uniqueEmail(prefix);
    const result = await api.register('E2E User', email, 'password123');
    return { api, email, accessToken: result.accessToken };
  }

  test('@api register a new user via API', async ({ request }) => {
    const api = new SetiApi(request);
    const email = uniqueEmail('auth-register');
    const result = await api.register('E2E User', email, 'password123');

    expect(result.accessToken).toBeTruthy();
    expect(result.user.email).toBe(email);
    expect(result.user.name).toBe('E2E User');
    expect(result.user.id).toBeTruthy();
  });

  test('@api login with registered user via API', async ({ request }) => {
    const { api, email } = await registerApiUser(request, 'auth-login');
    const result = await api.login(email, 'password123');

    expect(result.accessToken).toBeTruthy();
    expect(result.user.email).toBe(email);
  });

  test('@api reject duplicate registration', async ({ request }) => {
    const email = uniqueEmail('auth-duplicate');
    const api = new SetiApi(request);
    await api.register('Dup', email, 'password123');

    const res = await request.post(`${SERVER_URL}/auth/register`, {
      data: { name: 'Dup', email, password: 'password123' },
    });
    expect(res.status()).toBe(409);
  });

  test('@api reject login with wrong password', async ({ request }) => {
    const { email } = await registerApiUser(request, 'auth-wrong-password');

    const res = await request.post(`${SERVER_URL}/auth/login`, {
      data: { email, password: 'wrong-password' },
    });
    expect(res.status()).toBe(401);
  });

  test('@api reject login with non-existent email', async ({ request }) => {
    const res = await request.post(`${SERVER_URL}/auth/login`, {
      data: { email: 'nobody@nowhere.test', password: 'password123' },
    });
    expect(res.status()).toBe(401);
  });

  // ── Protected route access ─────────────────────────────────

  test('@api GET /auth/me requires authentication', async ({ request }) => {
    const res = await request.get(`${SERVER_URL}/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('@api GET /auth/me succeeds with valid token', async ({ request }) => {
    const { email, accessToken } = await registerApiUser(request, 'auth-me');

    const res = await request.get(`${SERVER_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.email).toBe(email);
  });

  // ── Browser auth flow ──────────────────────────────────────

  test('@real-ui unauthenticated user is redirected to /auth', async ({
    page,
  }) => {
    await page.goto('/lobby');
    // ProtectedRoute should redirect to /auth
    await page.waitForURL('**/auth', { timeout: 5_000 });
    expect(page.url()).toContain('/auth');
  });

  test('@real-ui auth page renders login form', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('#login-email')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#login-password')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('auth-login-submit')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('@real-ui successful login redirects to lobby', async ({
    page,
    request,
  }) => {
    // First register via API
    const email = `browser-auth-${Date.now()}@test.local`;
    const api = new SetiApi(request);
    await api.register('Browser User', email, 'password123');

    await page.goto('/auth');
    if (
      !(await page
        .locator('#login-email')
        .isVisible()
        .catch(() => false))
    ) {
      await page.getByTestId('auth-tab-login').click();
    }
    await expect(page.locator('#login-email')).toBeVisible({ timeout: 10_000 });
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill('password123');

    const loginResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/auth/login') && res.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await page.getByTestId('auth-login-submit').click();
    const response = await loginResponse;
    expect(response.ok()).toBe(true);

    await page.waitForURL('**/lobby', { timeout: 15_000 });
    await expect(page.getByTestId('lobby-new-mission')).toBeVisible({
      timeout: 10_000,
    });
  });
});
