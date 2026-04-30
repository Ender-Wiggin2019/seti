import { expect, type Page, type TestInfo, test } from '@playwright/test';
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

type TPageDiagnostics = {
  console: string[];
  httpErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
};

const MAX_DIAGNOSTIC_ENTRIES = 100;

function pushDiagnostic(entries: string[], entry: string): void {
  entries.push(entry);
  if (entries.length > MAX_DIAGNOSTIC_ENTRIES) {
    entries.shift();
  }
}

function capturePageDiagnostics(page: Page, label: string): TPageDiagnostics {
  const diagnostics: TPageDiagnostics = {
    console: [],
    httpErrors: [],
    pageErrors: [],
    requestFailures: [],
  };

  page.on('console', (message) => {
    const type = message.type();
    if (type !== 'error' && type !== 'warning') return;
    pushDiagnostic(
      diagnostics.console,
      `[${label}] ${type}: ${message.text()}`,
    );
  });

  page.on('pageerror', (error) => {
    pushDiagnostic(diagnostics.pageErrors, `[${label}] ${error.message}`);
  });

  page.on('requestfailed', (request) => {
    pushDiagnostic(
      diagnostics.requestFailures,
      `[${label}] ${request.method()} ${request.url()} ${
        request.failure()?.errorText ?? 'unknown failure'
      }`,
    );
  });

  page.on('response', (response) => {
    const status = response.status();
    if (status < 400) return;
    pushDiagnostic(
      diagnostics.httpErrors,
      `[${label}] ${status} ${response.request().method()} ${response.url()}`,
    );
  });

  return diagnostics;
}

async function attachPageState(
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> {
  await testInfo.attach(`${name}-url`, {
    body: JSON.stringify({ url: page.url() }, null, 2),
    contentType: 'application/json',
  });

  const screenshotPath = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(name, {
    path: screenshotPath,
    contentType: 'image/png',
  });
}

async function attachDiagnostics(
  testInfo: TestInfo,
  diagnostics: Record<string, TPageDiagnostics>,
): Promise<void> {
  await testInfo.attach('browser-smoke-diagnostics', {
    body: JSON.stringify(diagnostics, null, 2),
    contentType: 'application/json',
  });
}

test('browser smoke: register, room, game load, and first PASS sync', async ({
  browser,
  request,
}, testInfo) => {
  test.setTimeout(180_000);
  await waitForServerReady(request);

  const host = createUser('browser-smoke-host');
  const guest = createUser('browser-smoke-guest');

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();
  const diagnostics = {
    host: capturePageDiagnostics(hostPage, 'host'),
    guest: capturePageDiagnostics(guestPage, 'guest'),
  };

  try {
    await test.step('01 host registers through browser UI', async () => {
      await registerByUi(hostPage, host);
      await attachPageState(hostPage, testInfo, '01-host-registered');
    });

    await test.step('02 guest registers through browser UI', async () => {
      await registerByUi(guestPage, guest);
      await attachPageState(guestPage, testInfo, '02-guest-registered');
    });

    const roomId =
      await test.step('03 host creates a two-player room', async () => {
        const createdRoomId = await createRoomByUi(
          hostPage,
          `Browser Smoke Room ${Date.now()}`,
          2,
        );
        await attachPageState(hostPage, testInfo, '03-host-room-created');
        return createdRoomId;
      });

    await test.step('04 guest joins the room', async () => {
      await joinRoomByUi(guestPage, roomId);
      await attachPageState(guestPage, testInfo, '04-guest-room-joined');
    });

    const hostGameId =
      await test.step('05 host launches the game', async () => {
        const gameId = await launchGameByUi(hostPage, roomId);
        await attachPageState(hostPage, testInfo, '05-host-game-launched');
        return gameId;
      });

    const guestGameId =
      await test.step('06 guest enters the same game', async () => {
        const gameId = await enterGameByUi(guestPage, roomId);
        await attachPageState(guestPage, testInfo, '06-guest-game-entered');
        return gameId;
      });

    expect(guestGameId).toBe(hostGameId);

    await test.step('07 both browsers render the game dashboard', async () => {
      await expect(hostPage.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });
      await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });
      await attachPageState(hostPage, testInfo, '07-host-dashboard-visible');
      await attachPageState(guestPage, testInfo, '07-guest-dashboard-visible');
    });

    const { actor, other } =
      await test.step('08 first active player can PASS', async () => {
        const owner = await waitForActionOwner(hostPage, guestPage, 'PASS');
        await expect(owner.actor.locator(sel.actionMenu('PASS'))).toBeEnabled({
          timeout: 10_000,
        });
        await attachPageState(owner.actor, testInfo, '08-pass-actor-ready');
        return owner;
      });

    await test.step('09 PASS action updates the other browser', async () => {
      await clickPassAndWaitForLogSync(actor, other);
      await openEventLog(other);
      await attachPageState(actor, testInfo, '09-pass-actor-after-sync');
      await attachPageState(other, testInfo, '09-pass-other-after-sync');
    });
  } catch (error) {
    await attachPageState(hostPage, testInfo, 'failure-host');
    await attachPageState(guestPage, testInfo, 'failure-guest');
    throw error;
  } finally {
    await attachDiagnostics(testInfo, diagnostics);
    await hostContext.close();
    await guestContext.close();
  }
});
