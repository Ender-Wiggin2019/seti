import { expect, type Browser, type Page, test } from '@playwright/test';
import {
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  waitForAndResolveCardPrompt,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

async function openUserContext(browser: Browser): Promise<{
  context: Awaited<ReturnType<Browser['newContext']>>;
  page: Page;
}> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

async function getPassState(page: Page): Promise<'enabled' | 'disabled' | 'hidden'> {
  const pass = page.locator(sel.actionMenu('PASS'));
  const visible = await pass.isVisible().catch(() => false);
  if (!visible) return 'hidden';
  const enabled = await pass.isEnabled().catch(() => false);
  return enabled ? 'enabled' : 'disabled';
}

async function expectPassNotEnabled(page: Page): Promise<void> {
  await expect.poll(() => getPassState(page), {
    timeout: 10_000,
    message: 'Expected PASS to be unavailable for a non-active player',
  }).not.toBe('enabled');
}

async function waitForSinglePassOwner(
  pages: readonly Page[],
  timeout = 15_000,
): Promise<number> {
  await expect.poll(
    async () => {
      const states = await Promise.all(pages.map((page) => getPassState(page)));
      return states.filter((state) => state === 'enabled').length;
    },
    { timeout, message: 'Timed out waiting for exactly one PASS owner' },
  ).toBe(1);

  const finalStates = await Promise.all(pages.map((page) => getPassState(page)));
  return finalStates.findIndex((state) => state === 'enabled');
}

async function passWithEndOfRoundSelection(page: Page): Promise<void> {
  const pass = page.locator(sel.actionMenu('PASS'));
  await expect(pass).toBeVisible({ timeout: 10_000 });
  await expect(pass).toBeEnabled({ timeout: 10_000 });
  await pass.click();
  const resolved = await waitForAndResolveCardPrompt(page, 10_000);
  expect(resolved).toBe(true);
}

test('three-player pass rotation e2e: control hands off across three real browsers in order', async ({
  browser,
  request,
}) => {
  test.setTimeout(300_000);
  await waitForServerReady(request);

  const users = [
    createUser('three-host'),
    createUser('three-guest-a'),
    createUser('three-guest-b'),
  ];
  const sessions = await Promise.all(users.map(async () => openUserContext(browser)));
  const [host, guestA, guestB] = sessions;

  try {
    await Promise.all(
      sessions.map((session, index) => registerByUi(session.page, users[index])),
    );

    const roomId = await createRoomByUi(
      host.page,
      `Three Player Rotation ${Date.now()}`,
      3,
    );
    await joinRoomByUi(guestA.page, roomId);
    await joinRoomByUi(guestB.page, roomId);

    const hostGameId = await launchGameByUi(host.page, roomId);
    const [guestAGameId, guestBGameId] = await Promise.all([
      enterGameByUi(guestA.page, roomId),
      enterGameByUi(guestB.page, roomId),
    ]);
    expect([guestAGameId, guestBGameId]).toEqual([hostGameId, hostGameId]);

    const pages = [host.page, guestA.page, guestB.page];
    await Promise.all(
      pages.map((page) =>
        expect(page.locator(sel.bottomDashboard)).toBeVisible({ timeout: 15_000 }),
      ),
    );

    const firstOwner = await waitForSinglePassOwner(pages, 20_000);
    await passWithEndOfRoundSelection(pages[firstOwner]);

    const secondOwner = await waitForSinglePassOwner(pages, 20_000);
    expect(secondOwner).not.toBe(firstOwner);
    await expectPassNotEnabled(pages[firstOwner]);

    await passWithEndOfRoundSelection(pages[secondOwner]);

    const thirdOwner = await waitForSinglePassOwner(pages, 20_000);
    expect(thirdOwner).not.toBe(firstOwner);
    expect(thirdOwner).not.toBe(secondOwner);

    await expectPassNotEnabled(pages[firstOwner]);
    await expectPassNotEnabled(pages[secondOwner]);
    await expect(pages[thirdOwner].locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 10_000,
    });
  } finally {
    await Promise.all(
      sessions.map((session) => session.context.close().catch(() => undefined)),
    );
  }
});
