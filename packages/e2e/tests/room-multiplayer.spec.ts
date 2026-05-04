import { expect, type Browser, type Page, test } from '@playwright/test';
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

async function openUserContext(browser: Browser): Promise<{
  context: Awaited<ReturnType<Browser['newContext']>>;
  page: Page;
}> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

test('four-player room e2e: all players join through real UI and enter the same game', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const users = [
    createUser('four-host'),
    createUser('four-guest-a'),
    createUser('four-guest-b'),
    createUser('four-guest-c'),
  ];
  const sessions = await Promise.all(
    users.map(async () => openUserContext(browser)),
  );
  const [host, guestA, guestB, guestC] = sessions;

  try {
    await Promise.all(
      sessions.map((session, index) => registerByUi(session.page, users[index])),
    );

    const roomId = await createRoomByUi(
      host.page,
      `Four Player Room ${Date.now()}`,
      4,
    );
    await expect(
      host.page.locator('[data-testid="game-setting-value-players"]'),
    ).toHaveText('4');

    await joinRoomByUi(guestA.page, roomId);
    await joinRoomByUi(guestB.page, roomId);
    await joinRoomByUi(guestC.page, roomId);

    const hostGameId = await launchGameByUi(host.page, roomId);
    const guestGameIds = await Promise.all([
      enterGameByUi(guestA.page, roomId),
      enterGameByUi(guestB.page, roomId),
      enterGameByUi(guestC.page, roomId),
    ]);

    expect(guestGameIds).toEqual([hostGameId, hostGameId, hostGameId]);

    await Promise.all(
      sessions.map((session) =>
        expect(session.page.locator(sel.bottomDashboard)).toBeVisible({
          timeout: 15_000,
        }),
      ),
    );
  } finally {
    await Promise.all(
      sessions.map((session) => session.context.close().catch(() => undefined)),
    );
  }
});
