import { expect, type Page, type TestInfo, test } from '@playwright/test';
import {
  clickPassAndWaitForLogSync,
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  waitForActionOwner,
} from '../helpers/real-flow';
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

test('user-path game flow e2e (strict real interfaces): register -> room -> game -> pass', async ({
  browser,
  request,
}, testInfo) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('path-host');
  const guest = createUser('path-guest');

  try {
    await test.step('register host', async () => {
      await registerByUi(hostPage, host);
    });
    await test.step('register guest', async () => {
      await registerByUi(guestPage, guest);
    });

    const roomId = await test.step('host creates room', async () => {
      return createRoomByUi(hostPage, `Path Room ${Date.now()}`, 2);
    });
    await test.step('guest joins room', async () => {
      await joinRoomByUi(guestPage, roomId);
    });

    const hostGameId = await test.step('host launches game', async () => {
      return launchGameByUi(hostPage, roomId);
    });
    const guestGameId = await test.step('guest enters game', async () => {
      return enterGameByUi(guestPage, roomId);
    });
    expect(guestGameId).toBe(hostGameId);

    await expect(hostPage.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await attachStepScreenshot(
      hostPage,
      testInfo,
      'user-path-host-game-loaded',
    );
    await attachStepScreenshot(
      guestPage,
      testInfo,
      'user-path-guest-game-loaded',
    );

    const { actor, other } = await waitForActionOwner(
      hostPage,
      guestPage,
      'PASS',
    );
    await expect(actor.locator(sel.actionMenu('PASS'))).toBeVisible({
      timeout: 10_000,
    });
    await clickPassAndWaitForLogSync(actor, other);
    await attachStepScreenshot(actor, testInfo, 'user-path-after-pass-actor');

    await expect(other.locator(sel.eventLog)).toBeVisible({
      timeout: 10_000,
    });
    await attachStepScreenshot(other, testInfo, 'user-path-after-pass-other');
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});
