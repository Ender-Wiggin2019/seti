import { expect, test } from '@playwright/test';
import { SetiApi } from '../helpers/api';
import {
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

test.describe('Lobby & Room Management', () => {
  test.describe('API @api', () => {
    test('host creates room, guest joins, host starts, and list includes room', async ({
      request,
    }) => {
      await waitForServerReady(request);
      const hostApi = new SetiApi(request);
      const guestApi = new SetiApi(request);

      const hostAuth = await hostApi.register(
        'Host',
        `host-${Date.now()}@test.local`,
        'password123',
      );
      await guestApi.register(
        'Guest',
        `guest-${Date.now()}@test.local`,
        'password123',
      );

      const room = await hostApi.createRoom('Test Room', 2);

      expect(room.id).toBeTruthy();
      expect(room.name).toBe('Test Room');
      expect(room.status).toBe('waiting');
      expect(room.playerCount).toBe(2);
      expect(room.currentPlayers).toHaveLength(1);
      expect(room.currentPlayers[0].userId).toBe(hostAuth.user.id);

      const roomId = room.id;
      const joinedRoom = await guestApi.joinRoom(roomId);
      expect(joinedRoom.currentPlayers).toHaveLength(2);

      const startedRoom = await hostApi.startGame(roomId);
      expect(startedRoom.status).toBe('playing');

      const res = await request.get(`${SERVER_URL}/lobby/rooms`, {
        headers: { Authorization: `Bearer ${hostApi['token']}` },
      });
      expect(res.status()).toBe(200);

      const roomsPage = await res.json();
      expect(Array.isArray(roomsPage.items)).toBe(true);
      expect(roomsPage.total).toBeGreaterThanOrEqual(1);

      const found = roomsPage.items.find((r: { id: string }) => r.id === roomId);
      expect(found).toBeDefined();
      expect(found.status).toBe('playing');
    });
  });

  test.describe('Browser @real-ui', () => {
    test('lobby page renders after real UI registration/login flow', async ({
      page,
      request,
    }) => {
      await waitForServerReady(request);

      const user = createUser('lobby-ui');
      await registerByUi(page, user);

      await expect(page).toHaveURL(/\/lobby/);
      await expect(page.getByTestId('lobby-new-mission')).toBeVisible();
    });

    test('guest joins room and host starts game via room UI', async ({
      browser,
      request,
    }) => {
      await waitForServerReady(request);

      const hostContext = await browser.newContext();
      const guestContext = await browser.newContext();
      const hostPage = await hostContext.newPage();
      const guestPage = await guestContext.newPage();

      const host = createUser('lobby-host');
      const guest = createUser('lobby-guest');

      try {
        await registerByUi(hostPage, host);
        const roomId = await createRoomByUi(
          hostPage,
          `Lobby Room ${Date.now()}`,
          2,
        );

        await registerByUi(guestPage, guest);
        await joinRoomByUi(guestPage, roomId);

        const hostGameId = await launchGameByUi(hostPage, roomId);
        const guestGameId = await enterGameByUi(guestPage, roomId);
        expect(guestGameId).toBe(hostGameId);

        await expect(hostPage.locator(sel.bottomDashboard)).toBeVisible({
          timeout: 15_000,
        });
        await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible({
          timeout: 15_000,
        });
      } finally {
        await hostContext.close();
        await guestContext.close();
      }
    });

    test('hidden solo room stays out of Lobby, appears in My Games, and exposes player profile', async ({
      page,
      request,
    }) => {
      await waitForServerReady(request);

      const host = createUser('hidden-solo-host');
      const roomName = `Hidden Solo ${Date.now()}`;

      await registerByUi(page, host);
      const roomId = await createRoomByUi(page, roomName, 2, {
        isSoloMode: true,
        soloDifficulty: 3,
        visibleInLobby: false,
      });

      await page.goto('/lobby');
      await expect(page.getByTestId('mission-room-list')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText(roomName)).toHaveCount(0);

      await page.getByRole('link', { name: /my games/i }).click();
      await expect(page.getByTestId('my-games-page')).toBeVisible({
        timeout: 10_000,
      });
      const myGameCard = page.getByTestId('room-card').filter({
        hasText: roomName,
      });
      await expect(myGameCard).toBeVisible({ timeout: 10_000 });
      await expect(myGameCard.getByText('Hidden', { exact: true })).toBeVisible();
      await expect(myGameCard.getByText('Solo', { exact: true })).toBeVisible();

      await myGameCard.click();
      await page.waitForURL(new RegExp(`/room/${roomId}$`), {
        timeout: 10_000,
      });
      await expect(page.getByTestId('room-page')).toBeVisible({
        timeout: 10_000,
      });

      const profileResponse = page.waitForResponse(
        (res) =>
          res.url().includes(`/lobby/players/`) &&
          res.url().includes('/profile') &&
          res.request().method() === 'GET',
        { timeout: 10_000 },
      );
      await page.getByRole('button', { name: new RegExp(host.name) }).click();
      const response = await profileResponse;
      expect(response.ok()).toBe(true);

      await expect(page.getByTestId('player-public-profile')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByTestId('player-public-profile')).toContainText(
        host.name,
      );
      await expect(page.getByTestId('player-public-profile')).toContainText(
        roomName,
      );
    });
  });
});
