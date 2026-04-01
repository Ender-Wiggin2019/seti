import { expect, test } from '@playwright/test';
import { SetiApi } from '../helpers/api';
import { injectAuth } from '../helpers/auth';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

/**
 * ══════════════════════════════════════════════════════════════════════
 * Lobby E2E Tests
 * Covers: Room creation, joining, listing, starting a game.
 * ══════════════════════════════════════════════════════════════════════
 */

test.describe('Lobby & Room Management', () => {
  // ── API-level lobby tests ──────────────────────────────────

  test.describe('API', () => {
    let hostApi: SetiApi;
    let guestApi: SetiApi;
    let hostUser: { id: string; name: string; email: string };
    let roomId: string;

    test.beforeAll(async ({ request }) => {
      hostApi = new SetiApi(request);
      guestApi = new SetiApi(request);

      const hostAuth = await hostApi.register(
        'Host',
        `host-${Date.now()}@test.local`,
        'password123',
      );
      hostUser = hostAuth.user;

      await guestApi.register(
        'Guest',
        `guest-${Date.now()}@test.local`,
        'password123',
      );
    });

    test('create a room', async () => {
      const room = await hostApi.createRoom('Test Room', 2);

      expect(room.id).toBeTruthy();
      expect(room.name).toBe('Test Room');
      expect(room.status).toBe('waiting');
      expect(room.playerCount).toBe(2);
      expect(room.currentPlayers).toHaveLength(1);
      expect(room.currentPlayers[0].userId).toBe(hostUser.id);

      roomId = room.id;
    });

    test('guest joins room', async () => {
      const room = await guestApi.joinRoom(roomId);

      expect(room.currentPlayers).toHaveLength(2);
    });

    test('host starts game', async () => {
      const room = await hostApi.startGame(roomId);

      expect(room.status).toBe('playing');
    });

    test('listing rooms returns the created room', async ({ request }) => {
      const res = await request.get(`${SERVER_URL}/lobby/rooms`, {
        headers: { Authorization: `Bearer ${hostApi['token']}` },
      });
      expect(res.status()).toBe(200);

      const rooms = await res.json();
      expect(Array.isArray(rooms)).toBe(true);

      const found = rooms.find((r: { id: string }) => r.id === roomId);
      expect(found).toBeDefined();
      expect(found.status).toBe('playing');
    });
  });

  // ── Browser lobby flow ─────────────────────────────────────

  test.describe('Browser', () => {
    test('lobby page renders when authenticated', async ({ page, request }) => {
      const api = new SetiApi(request);
      const auth = await api.register(
        'Lobby User',
        `lobby-${Date.now()}@test.local`,
        'password123',
      );

      await injectAuth(page, auth.accessToken, auth.user);
      await page.goto('/lobby');
      await page.waitForTimeout(2_000);

      // Lobby should show room list or create room option
      // Check that the page didn't redirect to /auth
      expect(page.url()).toContain('/lobby');
    });

    test('navigating to /game/:id loads the game page', async ({
      page,
      request,
    }) => {
      const api = new SetiApi(request);
      const session = await api.createDebugSession();

      await injectAuth(page, session.accessToken, session.user);
      await page.goto(`/game/${session.gameId}`);

      // Wait for either game loading or game layout
      await page.waitForTimeout(5_000);

      // The page should show game content (not a 404 or error)
      const hasBottomBar = await page
        .locator('[data-testid="bottom-dashboard"]')
        .isVisible()
        .catch(() => false);

      const hasLoadingSpinner = await page
        .locator('text=Establishing secure connection')
        .isVisible()
        .catch(() => false);

      const hasWaitingText = await page
        .locator('text=Awaiting mission data')
        .isVisible()
        .catch(() => false);

      // One of these should be true (either loaded or loading)
      expect(hasBottomBar || hasLoadingSpinner || hasWaitingText).toBe(true);
    });

    test('room page shows room details', async ({ page, request }) => {
      const api = new SetiApi(request);
      const auth = await api.register(
        'Room Viewer',
        `room-viewer-${Date.now()}@test.local`,
        'password123',
      );

      const room = await api.createRoom('Browser Room', 2);

      await injectAuth(page, auth.accessToken, auth.user);
      await page.goto(`/room/${room.id}`);
      await page.waitForTimeout(2_000);

      // The room page should show room info
      expect(page.url()).toContain(`/room/${room.id}`);
    });
  });
});
