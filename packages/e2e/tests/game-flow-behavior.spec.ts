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

test('behavior flow e2e: no debug API, no injected auth, no ws shortcuts', async ({
  browser,
  request,
}, testInfo) => {
  test.setTimeout(180_000);
  await waitForServerReady(request);

  const host = createUser('behavior-host');
  const guest = createUser('behavior-guest');

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(
      hostPage,
      `Behavior Room ${Date.now()}`,
      2,
    );
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
    await attachStepScreenshot(hostPage, testInfo, 'behavior-host-in-game');
    await attachStepScreenshot(guestPage, testInfo, 'behavior-guest-in-game');

    const { actor, other } = await waitForActionOwner(
      hostPage,
      guestPage,
      'PASS',
    );
    await expect(actor.locator(sel.actionMenu('PASS'))).toBeVisible({
      timeout: 10_000,
    });
    await clickPassAndWaitForLogSync(actor, other);

    await expect(other.locator(sel.eventLog)).toBeVisible({
      timeout: 10_000,
    });
    await attachStepScreenshot(actor, testInfo, 'behavior-after-pass-actor');
    await attachStepScreenshot(other, testInfo, 'behavior-after-pass-other');
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});
