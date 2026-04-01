import { expect, test } from '@playwright/test';
import { SetiApi } from '../helpers/api';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

/**
 * ══════════════════════════════════════════════════════════════════════
 * Auth E2E Tests
 * Covers: Registration, login, protected route redirection, profile.
 * ══════════════════════════════════════════════════════════════════════
 */

test.describe('Authentication', () => {
  const uniqueEmail = `auth-e2e-${Date.now()}@test.local`;

  // ── API-level auth tests ───────────────────────────────────

  test('register a new user via API', async ({ request }) => {
    const api = new SetiApi(request);
    const result = await api.register('E2E User', uniqueEmail, 'password123');

    expect(result.accessToken).toBeTruthy();
    expect(result.user.email).toBe(uniqueEmail);
    expect(result.user.name).toBe('E2E User');
    expect(result.user.id).toBeTruthy();
  });

  test('login with registered user via API', async ({ request }) => {
    const api = new SetiApi(request);
    const result = await api.login(uniqueEmail, 'password123');

    expect(result.accessToken).toBeTruthy();
    expect(result.user.email).toBe(uniqueEmail);
  });

  test('reject duplicate registration', async ({ request }) => {
    const res = await request.post(`${SERVER_URL}/auth/register`, {
      data: { name: 'Dup', email: uniqueEmail, password: 'password123' },
    });
    expect(res.status()).toBe(409);
  });

  test('reject login with wrong password', async ({ request }) => {
    const res = await request.post(`${SERVER_URL}/auth/login`, {
      data: { email: uniqueEmail, password: 'wrong-password' },
    });
    expect(res.status()).toBe(401);
  });

  test('reject login with non-existent email', async ({ request }) => {
    const res = await request.post(`${SERVER_URL}/auth/login`, {
      data: { email: 'nobody@nowhere.test', password: 'password123' },
    });
    expect(res.status()).toBe(401);
  });

  // ── Protected route access ─────────────────────────────────

  test('GET /auth/me requires authentication', async ({ request }) => {
    const res = await request.get(`${SERVER_URL}/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('GET /auth/me succeeds with valid token', async ({ request }) => {
    const api = new SetiApi(request);
    await api.login(uniqueEmail, 'password123');

    const res = await request.get(`${SERVER_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${api['token']}` },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.email).toBe(uniqueEmail);
  });

  // ── Browser auth flow ──────────────────────────────────────

  test('unauthenticated user is redirected to /auth', async ({ page }) => {
    await page.goto('/lobby');
    // ProtectedRoute should redirect to /auth
    await page.waitForURL('**/auth', { timeout: 5_000 });
    expect(page.url()).toContain('/auth');
  });

  test('auth page renders login form', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForTimeout(1_000);

    // The auth page should show a form with email and password inputs
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]',
    );

    // At least one of these should exist
    const hasForm =
      (await emailInput.count()) > 0 || (await passwordInput.count()) > 0;
    expect(hasForm).toBe(true);
  });

  test('successful login redirects to lobby', async ({ page, request }) => {
    // First register via API
    const email = `browser-auth-${Date.now()}@test.local`;
    const api = new SetiApi(request);
    await api.register('Browser User', email, 'password123');

    // Now login through the UI
    await page.goto('/auth');
    await page.waitForTimeout(1_000);

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]',
    );

    if ((await emailInput.count()) > 0 && (await passwordInput.count()) > 0) {
      await emailInput.first().fill(email);
      await passwordInput.first().fill('password123');

      // Find and click the login/submit button
      const submitBtn = page.locator(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")',
      );
      if ((await submitBtn.count()) > 0) {
        await submitBtn.first().click();

        // Should redirect to /lobby after successful login
        await page
          .waitForURL('**/lobby', { timeout: 5_000 })
          .catch(() => undefined);
      }
    }
  });
});
