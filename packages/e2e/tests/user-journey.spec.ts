import {
  type Browser,
  expect,
  type Page,
  type TestInfo,
  test,
} from '@playwright/test';
import {
  clickPassAndWaitForLogSync,
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  openEventLog,
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

async function openUserContext(browser: Browser): Promise<{
  context: Awaited<ReturnType<Browser['newContext']>>;
  page: Page;
}> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

test.describe('User Journey E2E (Real Flow Only)', () => {
  test('register + create room + join game + pass action', async ({
    browser,
    request,
  }, testInfo) => {
    await waitForServerReady(request);

    const hostUser = createUser('journey-host');
    const guestUser = createUser('journey-guest');

    const host = await openUserContext(browser);
    const guest = await openUserContext(browser);

    try {
      await registerByUi(host.page, hostUser);
      await registerByUi(guest.page, guestUser);

      const roomId = await createRoomByUi(
        host.page,
        `Journey Room ${Date.now()}`,
        2,
      );
      await attachStepScreenshot(host.page, testInfo, 'journey-room-created');

      await joinRoomByUi(guest.page, roomId);
      await attachStepScreenshot(guest.page, testInfo, 'journey-guest-joined');

      const hostGameId = await launchGameByUi(host.page, roomId);
      const guestGameId = await enterGameByUi(guest.page, roomId);
      expect(guestGameId).toBe(hostGameId);

      await expect(host.page.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });
      await expect(guest.page.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });
      await attachStepScreenshot(host.page, testInfo, 'journey-host-in-game');
      await attachStepScreenshot(guest.page, testInfo, 'journey-guest-in-game');

      const { actor, other } = await waitForActionOwner(
        host.page,
        guest.page,
        'PASS',
      );
      await expect(actor.locator(sel.actionMenu('PASS'))).toBeEnabled({
        timeout: 10_000,
      });
      await clickPassAndWaitForLogSync(actor, other);

      await openEventLog(other);
      await attachStepScreenshot(actor, testInfo, 'journey-after-pass-actor');
      await attachStepScreenshot(other, testInfo, 'journey-after-pass-other');
    } finally {
      await host.context.close();
      await guest.context.close();
    }
  });

  test('three users join the same game and all enter game page', async ({
    browser,
    request,
  }, testInfo) => {
    test.setTimeout(120_000);
    await waitForServerReady(request);

    const hostUser = createUser('multi-host');
    const guestUser1 = createUser('multi-g1');
    const guestUser2 = createUser('multi-g2');

    const host = await openUserContext(browser);
    const guest1 = await openUserContext(browser);
    const guest2 = await openUserContext(browser);

    try {
      await registerByUi(host.page, hostUser);
      await registerByUi(guest1.page, guestUser1);
      await registerByUi(guest2.page, guestUser2);

      const roomId = await createRoomByUi(
        host.page,
        `3P Journey Room ${Date.now()}`,
        3,
      );
      await joinRoomByUi(guest1.page, roomId);
      await joinRoomByUi(guest2.page, roomId);

      const hostGameId = await launchGameByUi(host.page, roomId);
      const guestGameId1 = await enterGameByUi(guest1.page, roomId);
      const guestGameId2 = await enterGameByUi(guest2.page, roomId);

      expect(guestGameId1).toBe(hostGameId);
      expect(guestGameId2).toBe(hostGameId);

      await expect(host.page.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });
      await expect(guest1.page.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });
      await expect(guest2.page.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });

      await attachStepScreenshot(host.page, testInfo, 'multi-host-in-game');
      await attachStepScreenshot(guest1.page, testInfo, 'multi-guest1-in-game');
      await attachStepScreenshot(guest2.page, testInfo, 'multi-guest2-in-game');
    } finally {
      await host.context.close();
      await guest1.context.close();
      await guest2.context.close();
    }
  });
});
