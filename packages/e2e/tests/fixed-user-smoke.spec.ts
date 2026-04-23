import { expect, type Page, test } from '@playwright/test';
import {
  clickPassAndWaitForLogSync,
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  loginByUi,
  openEventLog,
  registerByUi,
  waitForActionOwner,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const FIXED_HOST = {
  name: '111',
  email: '111@e2e.test',
  password: '11111111',
} as const;

async function registerOrLoginByUi(
  page: Page,
  user: typeof FIXED_HOST,
): Promise<'registered' | 'logged-in'> {
  await page.goto('/auth');
  await page.getByRole('tab').nth(1).click();
  await expect(page.locator('#reg-name')).toBeVisible({ timeout: 10_000 });
  await page.locator('#reg-name').fill(user.name);
  await page.locator('#reg-email').fill(user.email);
  await page.locator('#reg-password').fill(user.password);

  const registerResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/auth/register') && res.request().method() === 'POST',
    { timeout: 15_000 },
  );
  await page.getByTestId('auth-register-submit').click();
  const registerResponse = await registerResponsePromise;

  if (registerResponse.ok()) {
    await page.waitForURL('**/lobby', { timeout: 15_000 });
    return 'registered';
  }

  expect(registerResponse.status()).toBe(409);
  await loginByUi(page, user);
  return 'logged-in';
}

test('fixed-user smoke: 111 creates room and completes room flow', async ({
  browser,
  request,
}) => {
  test.setTimeout(180_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();
  const guest = createUser('fixed-user-guest');

  try {
    await registerOrLoginByUi(hostPage, FIXED_HOST);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(
      hostPage,
      `Smoke Room ${Date.now()}`,
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

    const { actor, other } = await waitForActionOwner(
      hostPage,
      guestPage,
      'PASS',
    );
    await expect(actor.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 10_000,
    });
    await clickPassAndWaitForLogSync(actor, other);
    await openEventLog(other);
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});
