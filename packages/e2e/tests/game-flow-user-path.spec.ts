import { expect, type Page, type TestInfo, test } from '@playwright/test';
import { SetiApi } from '../helpers/api';
import { injectAuth } from '../helpers/auth';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

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

test('user-path game flow e2e (normal interfaces): register/login -> room -> game -> interaction', async ({
  browser,
  page,
  request,
}, testInfo) => {
  test.setTimeout(120_000);
  await waitForServerReady(request);

  const hostApi = new SetiApi(request);
  const guestApi = new SetiApi(request);
  const host = await hostApi.register(
    'Path Host',
    `path-host-${Date.now()}@e2e.test`,
    'password123',
  );
  const guest = await guestApi.register(
    'Path Guest',
    `path-guest-${Date.now()}@e2e.test`,
    'password123',
  );

  const room = await hostApi.createRoom(`Path Room ${Date.now()}`, 2);
  await guestApi.joinRoom(room.id);

  await injectAuth(page, host.accessToken, host.user);
  await page.goto(`/room/${room.id}`);
  const launchBtn = page.getByRole('button', { name: 'Launch Game' });
  await expect(launchBtn).toBeVisible({ timeout: 15_000 });
  await launchBtn.click();

  await page.waitForURL(/\/game\/[^/?#]+$/, { timeout: 15_000 });
  const gameId = page.url().split('/game/')[1]?.split(/[?#]/)[0];
  expect(gameId).toBeTruthy();

  await expect(page.locator(sel.bottomDashboard)).toBeVisible({
    timeout: 15_000,
  });
  await attachStepScreenshot(page, testInfo, 'user-path-host-game-loaded');

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  try {
    await injectAuth(guestPage, guest.accessToken, guest.user);
    await guestPage.goto(`/game/${gameId}`);
    await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await attachStepScreenshot(
      guestPage,
      testInfo,
      'user-path-guest-game-loaded',
    );

    const hostPass = page.locator(sel.actionMenu('PASS'));
    await expect(hostPass).toBeVisible({ timeout: 10_000 });
    await hostPass.click();
    await attachStepScreenshot(page, testInfo, 'user-path-host-after-pass');

    await expect(guestPage.locator(sel.bottomActions)).toBeVisible();
    await attachStepScreenshot(
      guestPage,
      testInfo,
      'user-path-guest-after-pass',
    );

    await expect(page.locator(sel.bottomDashboard)).toBeVisible();
    await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible();
  } finally {
    await guestContext.close();
  }
});
