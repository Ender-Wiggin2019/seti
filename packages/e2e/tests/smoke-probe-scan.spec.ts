import { expect, type Page, type TestInfo, test } from '@playwright/test';
import {
  clickEndTurn,
  clickMainAction,
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  resolveScanSubActions,
  waitForActionHandoff,
  waitForActionOwner,
  waitForInputPrompt,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

async function attachScreenshot(
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

test.describe('Smoke: Room → Launch Probe → Scan', () => {
  test('full real-UI flow from room creation through launch probe and scan', async ({
    browser,
    request,
  }, testInfo) => {
    test.setTimeout(180_000);
    await waitForServerReady(request);

    const host = createUser('smoke-host');
    const guest = createUser('smoke-guest');

    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      // ── Step 1: Register both players ────────────────────────
      await registerByUi(hostPage, host);
      await registerByUi(guestPage, guest);
      await attachScreenshot(hostPage, testInfo, '01-host-registered');

      // ── Step 2: Create room and join ─────────────────────────
      const roomId = await createRoomByUi(
        hostPage,
        `Smoke Room ${Date.now()}`,
        2,
      );
      await joinRoomByUi(guestPage, roomId);
      await attachScreenshot(hostPage, testInfo, '02-room-created');

      // ── Step 3: Launch game ──────────────────────────────────
      const hostGameId = await launchGameByUi(hostPage, roomId);
      const guestGameId = await enterGameByUi(guestPage, roomId);
      expect(guestGameId).toBe(hostGameId);

      await expect(hostPage.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });
      await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });
      await attachScreenshot(hostPage, testInfo, '03-host-in-game');
      await attachScreenshot(guestPage, testInfo, '03-guest-in-game');

      // ── Step 4: Find who is the active player ────────────────
      const { actor: p1, other: p2 } = await waitForActionOwner(
        hostPage,
        guestPage,
        'LAUNCH_PROBE',
      );
      await attachScreenshot(p1, testInfo, '04-active-player-before-launch');

      // ── Step 5: Launch Probe ─────────────────────────────────
      await clickMainAction(p1, 'LAUNCH_PROBE');
      await clickEndTurn(p1);

      await waitForActionHandoff(p1, p2, 'SCAN', 20_000);

      await attachScreenshot(p1, testInfo, '05-after-launch-probe-p1');
      await attachScreenshot(p2, testInfo, '05-after-launch-probe-p2');

      // ── Step 6: After P1 used main action, turn goes to P2 ──
      const scanActor = p2;
      const scanOther = p1;
      await expect(scanActor.locator(sel.actionMenu('SCAN'))).toBeEnabled({
        timeout: 20_000,
      });
      await attachScreenshot(scanActor, testInfo, '06-scan-actor-ready');

      // ── Step 7: Scan ─────────────────────────────────────────
      const scanActorLog = scanActor.locator('[data-testid^="event-entry-"]');
      const scanOtherLog = scanOther.locator('[data-testid^="event-entry-"]');
      const scanActorLogBefore = await scanActorLog.count();
      const scanOtherLogBefore = await scanOtherLog.count();

      await clickMainAction(scanActor, 'SCAN');

      // Scan triggers sub-action prompts (mark earth, mark card row, etc.)
      const hasPrompt = await waitForInputPrompt(scanActor, 10_000);
      await attachScreenshot(scanActor, testInfo, '07-scan-input-prompt');

      if (hasPrompt) {
        await resolveScanSubActions(scanActor);
      }

      // Scan resolved → phase is AWAIT_END_TURN, explicit End Turn required.
      await clickEndTurn(scanActor);

      // Wait for scan resolution to complete, sync the event log, and hand turn back.
      await expect
        .poll(async () => scanActorLog.count(), { timeout: 10_000 })
        .toBeGreaterThan(scanActorLogBefore);
      await expect
        .poll(async () => scanOtherLog.count(), { timeout: 10_000 })
        .toBeGreaterThan(scanOtherLogBefore);
      await waitForActionHandoff(scanActor, scanOther, 'PASS', 20_000);
      await attachScreenshot(scanActor, testInfo, '08-after-scan-actor');
      await attachScreenshot(scanOther, testInfo, '08-after-scan-other');

      // ── Step 8: Verify the next player received control after scan ─
      await expect(scanOther.locator(sel.actionMenu('PASS'))).toBeEnabled({
        timeout: 10_000,
      });

      // ── Step 9: Verify game is still running ─────────────────
      await expect(scanActor.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 10_000,
      });
      await expect(scanOther.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});
