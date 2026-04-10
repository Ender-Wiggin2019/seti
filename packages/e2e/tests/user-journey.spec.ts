import {
  type Browser,
  expect,
  type Page,
  type TestInfo,
  test,
} from '@playwright/test';
import { SetiApi } from '../helpers/api';
import { injectAuth } from '../helpers/auth';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

type TAuthSession = {
  accessToken: string;
  user: { id: string; name: string; email: string };
};

async function attachStepScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> {
  const screenshotPath = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(name, {
    path: screenshotPath,
    contentType: 'image/png',
  });
}

async function registerByUiAndAssert(
  browser: Browser,
  user: { name: string; email: string; password: string },
  testInfo: TestInfo,
): Promise<void> {
  const registerContext = await browser.newContext();
  const registerPage = await registerContext.newPage();

  try {
    await registerPage.goto('/auth');
    await registerPage.getByRole('tab', { name: 'Register' }).click();
    await registerPage.locator('#reg-name').fill(user.name);
    await registerPage.locator('#reg-email').fill(user.email);
    await registerPage.locator('#reg-password').fill(user.password);

    const registerResponsePromise = registerPage.waitForResponse(
      (res) =>
        res.url().includes('/auth/register') &&
        res.request().method() === 'POST',
    );
    await registerPage
      .getByRole('button', { name: 'Register New Operative' })
      .click();
    const registerResponse = await registerResponsePromise;
    expect(registerResponse.ok()).toBe(true);
    await attachStepScreenshot(registerPage, testInfo, 'ui-register-success');
  } finally {
    await registerContext.close();
  }
}

async function loginByUiAndGetSession(
  browser: Browser,
  user: { email: string; password: string },
  testInfo: TestInfo,
): Promise<void> {
  const loginContext = await browser.newContext();
  const loginPage = await loginContext.newPage();

  try {
    await loginPage.goto('/auth');
    await loginPage.locator('#login-email').fill(user.email);
    await loginPage.locator('#login-password').fill(user.password);

    const loginResponsePromise = loginPage.waitForResponse(
      (res) =>
        res.url().includes('/auth/login') && res.request().method() === 'POST',
    );
    await loginPage.getByRole('button', { name: 'Access Terminal' }).click();
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.ok()).toBe(true);
    await attachStepScreenshot(loginPage, testInfo, 'ui-login-success');
  } finally {
    await loginContext.close();
  }
}

test.describe('User Journey E2E', () => {
  test('register + login + create room + join game + in-game action', async ({
    browser,
    page,
    request,
  }, testInfo) => {
    await waitForServerReady(request);

    const host = {
      name: 'Journey Host',
      email: `journey-host-${Date.now()}@e2e.test`,
      password: 'password123',
    };
    const guest = {
      name: 'Journey Guest',
      email: `journey-guest-${Date.now()}@e2e.test`,
      password: 'password123',
    };
    const roomName = `Journey Room ${Date.now()}`;
    const hostApi = new SetiApi(request);
    const guestApi = new SetiApi(request);
    let hostLoginSession: TAuthSession;

    await test.step('register host by UI', async () => {
      await registerByUiAndAssert(browser, host, testInfo);
    });

    await test.step('login host by UI', async () => {
      await loginByUiAndGetSession(browser, host, testInfo);
      hostLoginSession = await hostApi.login(host.email, host.password);
      expect(hostLoginSession.accessToken).toBeTruthy();
      expect(hostLoginSession.user.email).toBe(host.email);

      await injectAuth(
        page,
        hostLoginSession.accessToken,
        hostLoginSession.user,
      );
      await page.goto('/lobby');
      await expect(
        page.getByRole('button', { name: /New Mission/ }),
      ).toBeVisible();
      await attachStepScreenshot(page, testInfo, 'host-lobby-after-login');
    });

    const { roomId, gameId } =
      await test.step('create room by UI + guest joins via API + host starts game by UI', async () => {
        const guestAuth = await guestApi.register(
          guest.name,
          guest.email,
          guest.password,
        );
        expect(guestAuth.user.email).toBe(guest.email);

        await page.goto('/lobby');
        await page.getByRole('button', { name: /New Mission/ }).click();
        await page.locator('#room-name').fill(roomName);
        await page.locator('#player-count').selectOption('2');

        const createRoomResponsePromise = page.waitForResponse(
          (res) =>
            res.url().includes('/lobby/rooms') &&
            res.request().method() === 'POST',
        );
        await page.getByRole('button', { name: 'Launch Mission' }).click();
        const createRoomResponse = await createRoomResponsePromise;
        expect(createRoomResponse.ok()).toBe(true);
        const createdRoom = await createRoomResponse.json();
        const createdRoomId = createdRoom.id as string;
        await attachStepScreenshot(page, testInfo, 'host-room-created-2p');

        await guestApi.joinRoom(createdRoomId);

        await page.goto(`/room/${createdRoomId}`);
        const launchBtn = page.getByRole('button', { name: 'Launch Game' });
        await expect(launchBtn).toBeVisible({ timeout: 15_000 });
        await launchBtn.click();

        await page.waitForURL(/\/game\/[^/?#]+$/, { timeout: 15_000 });
        const createdGameId = page.url().split('/game/')[1]?.split(/[?#]/)[0];
        expect(createdGameId).toBeTruthy();

        await expect(page.locator(sel.bottomDashboard)).toBeVisible({
          timeout: 15_000,
        });
        await attachStepScreenshot(page, testInfo, 'host-game-loaded-2p');
        return { roomId: createdRoomId, gameId: createdGameId as string };
      });

    await test.step('perform in-game interaction by UI', async () => {
      const passBtn = page.locator(sel.actionMenu('PASS'));
      await expect(passBtn).toBeVisible({ timeout: 10_000 });

      const eventsBefore = await page
        .locator('[data-testid^="event-entry-"]')
        .count();
      await passBtn.click();
      await page.waitForTimeout(1_000);
      const eventsAfter = await page
        .locator('[data-testid^="event-entry-"]')
        .count();

      expect(eventsAfter).toBeGreaterThanOrEqual(eventsBefore);
      await expect(page.locator(sel.bottomDashboard)).toBeVisible();
      await attachStepScreenshot(page, testInfo, 'host-after-pass-2p');
    });

    expect(roomId).toBeTruthy();
    expect(gameId).toBeTruthy();
  });

  test('multi-player: 3 players can join and enter the same game', async ({
    browser,
    page,
    request,
  }, testInfo) => {
    test.setTimeout(120_000);
    await waitForServerReady(request);

    const host = {
      name: 'Multi Host',
      email: `multi-host-${Date.now()}@e2e.test`,
      password: 'password123',
    };
    const guest1 = {
      name: 'Multi Guest One',
      email: `multi-g1-${Date.now()}@e2e.test`,
      password: 'password123',
    };
    const guest2 = {
      name: 'Multi Guest Two',
      email: `multi-g2-${Date.now()}@e2e.test`,
      password: 'password123',
    };

    const guestApi1 = new SetiApi(request);
    const guestApi2 = new SetiApi(request);
    const hostApi = new SetiApi(request);
    const roomName = `3P Journey Room ${Date.now()}`;

    await registerByUiAndAssert(browser, host, testInfo);
    await loginByUiAndGetSession(browser, host, testInfo);
    const hostLoginSession = await hostApi.login(host.email, host.password);
    await injectAuth(page, hostLoginSession.accessToken, hostLoginSession.user);
    await page.goto('/lobby');
    await expect(
      page.getByRole('button', { name: /New Mission/ }),
    ).toBeVisible();
    await attachStepScreenshot(page, testInfo, 'host-lobby-3p');

    const guestAuth1 = await guestApi1.register(
      guest1.name,
      guest1.email,
      guest1.password,
    );
    const guestAuth2 = await guestApi2.register(
      guest2.name,
      guest2.email,
      guest2.password,
    );

    const createdRoomId =
      await test.step('host creates a 3-player room via UI', async () => {
        await page.getByRole('button', { name: /New Mission/ }).click();
        await page.locator('#room-name').fill(roomName);
        await page.locator('#player-count').selectOption('3');

        const createRoomResponsePromise = page.waitForResponse(
          (res) =>
            res.url().includes('/lobby/rooms') &&
            res.request().method() === 'POST',
        );
        await page.getByRole('button', { name: 'Launch Mission' }).click();
        const createRoomResponse = await createRoomResponsePromise;
        expect(createRoomResponse.ok()).toBe(true);

        const body = await createRoomResponse.json();
        expect(body.id).toBeTruthy();
        await attachStepScreenshot(page, testInfo, 'host-room-created-3p');
        return body.id as string;
      });

    await guestApi1.joinRoom(createdRoomId);
    await guestApi2.joinRoom(createdRoomId);

    const createdGameId =
      await test.step('host starts game via UI', async () => {
        await page.goto(`/room/${createdRoomId}`);
        const launchBtn = page.getByRole('button', { name: 'Launch Game' });
        await expect(launchBtn).toBeVisible({ timeout: 15_000 });
        await launchBtn.click();

        await page.waitForURL(/\/game\/[^/?#]+$/, { timeout: 15_000 });
        const id = page.url().split('/game/')[1]?.split(/[?#]/)[0];
        expect(id).toBeTruthy();
        await attachStepScreenshot(page, testInfo, 'host-game-loaded-3p');
        return id as string;
      });

    const guestContext1 = await browser.newContext();
    const guestContext2 = await browser.newContext();
    const guestPage1 = await guestContext1.newPage();
    const guestPage2 = await guestContext2.newPage();

    try {
      await injectAuth(guestPage1, guestAuth1.accessToken, guestAuth1.user);
      await injectAuth(guestPage2, guestAuth2.accessToken, guestAuth2.user);

      await guestPage1.goto(`/game/${createdGameId}`);
      await guestPage2.goto(`/game/${createdGameId}`);

      await expect(page.locator(sel.bottomDashboard)).toBeVisible();
      await expect(guestPage1.locator(sel.bottomDashboard)).toBeVisible();
      await expect(guestPage2.locator(sel.bottomDashboard)).toBeVisible();
      await attachStepScreenshot(guestPage1, testInfo, 'guest1-game-loaded-3p');
      await attachStepScreenshot(guestPage2, testInfo, 'guest2-game-loaded-3p');

      const hostPass = page.locator(sel.actionMenu('PASS'));
      await expect(hostPass).toBeVisible();
      await hostPass.click();
      await attachStepScreenshot(page, testInfo, 'host-after-pass-3p');

      await expect(guestPage1.locator(sel.bottomDashboard)).toBeVisible();
      await expect(guestPage2.locator(sel.bottomDashboard)).toBeVisible();
    } finally {
      await guestContext1.close();
      await guestContext2.close();
    }
  });
});
