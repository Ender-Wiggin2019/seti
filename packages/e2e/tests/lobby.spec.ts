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
  test.describe('API', () => {
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

      const rooms = await res.json();
      expect(Array.isArray(rooms)).toBe(true);

      const found = rooms.find((r: { id: string }) => r.id === roomId);
      expect(found).toBeDefined();
      expect(found.status).toBe('playing');
    });
  });

  test.describe('Browser (Real Flow)', () => {
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
  });
});
