import { type Browser, expect, type Page, test } from '@playwright/test';
import {
  clickMainAction,
  clickPassAndWaitForLogSync,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  waitForActionOwner,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const NIAC_PROGRAM_CARD_ID = '89';
const MAX_CORNER_DISCARDS = 12;
const SEEDED_NIAC_GAME = 'complete-mission-e2e-7';

async function handCount(page: Page): Promise<number> {
  const text = await page
    .locator('[data-testid="hand-dock"]')
    .locator('text=/\\d+ cards?/')
    .first()
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

async function resourceValue(page: Page, id: string): Promise<number> {
  const text = await page
    .locator(`[data-testid="resource-${id}"] .readout`)
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

async function openExpandedFreeActions(page: Page): Promise<void> {
  const corner = page.locator(sel.freeAction('USE_CARD_CORNER'));
  if (!(await corner.isVisible().catch(() => false))) {
    await page.locator(sel.freeActionToggle).click();
  }
  await expect(corner).toBeVisible({ timeout: 10_000 });
}

async function hasHandCard(page: Page, cardId: string): Promise<boolean> {
  return (await page.locator(sel.handCard(cardId)).count()) > 0;
}

async function closeCardDetailIfOpen(page: Page): Promise<void> {
  const closeButton = page
    .locator('.fixed.inset-0')
    .getByRole('button', { name: /^close$/i });
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click({ force: true });
  }
}

async function discardFirstHandCardByCorner(page: Page): Promise<void> {
  await openExpandedFreeActions(page);
  const corner = page.locator(sel.freeAction('USE_CARD_CORNER'));
  await expect(corner).toBeEnabled({ timeout: 10_000 });
  const before = await handCount(page);

  await corner.click();
  await expect(page.locator('[data-testid="hand-dock"]')).toHaveAttribute(
    'data-expanded',
    'true',
    { timeout: 10_000 },
  );

  const card = page
    .locator('[data-testid="bottom-hand"] [data-testid^="hand-card-"]')
    .first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.evaluate((element) => {
    (element as HTMLElement).click();
  });
  await closeCardDetailIfOpen(page);

  await expect
    .poll(() => handCount(page), { timeout: 15_000 })
    .toBe(before - 1);
}

async function resolveVisiblePromptBySkippingMissionClaim(
  page: Page,
): Promise<void> {
  const skip = page.locator(sel.inputOption('skip-missions'));
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  }
}

async function createRoomByUiWithSeed(
  page: Page,
  roomName: string,
  seed: string,
): Promise<string> {
  await page.goto('/lobby');
  await page.getByTestId('lobby-new-mission').click();
  await expect(page.getByTestId('create-room-dialog')).toBeVisible({
    timeout: 10_000,
  });
  await page.locator('#room-name').fill(roomName);

  await page.route('**/lobby/rooms', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const body = JSON.parse(route.request().postData() ?? '{}') as {
      seed?: string;
    };
    await route.continue({
      postData: JSON.stringify({ ...body, seed }),
    });
  });

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/lobby/rooms') && res.request().method() === 'POST',
    { timeout: 15_000 },
  );
  const dialog = page.getByTestId('create-room-dialog');
  await dialog.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const submitButton = page.getByTestId('create-room-submit');
  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click();
  const response = await responsePromise;
  await page.unroute('**/lobby/rooms');
  expect(response.ok()).toBe(true);

  const room = (await response.json()) as { id?: string };
  expect(room.id).toBeTruthy();
  await page.waitForURL(new RegExp(`/room/${room.id as string}$`), {
    timeout: 15_000,
  });
  return room.id as string;
}

async function createStartedTwoPlayerGame(browser: Browser): Promise<{
  hostContext: Awaited<ReturnType<Browser['newContext']>>;
  guestContext: Awaited<ReturnType<Browser['newContext']>>;
  hostPage: Page;
  guestPage: Page;
}> {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('complete-mission-host');
  const guest = createUser('complete-mission-guest');

  await registerByUi(hostPage, host);
  await registerByUi(guestPage, guest);

  const roomId = await createRoomByUiWithSeed(
    hostPage,
    `Complete Mission Room ${Date.now()}`,
    SEEDED_NIAC_GAME,
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

  return { hostContext, guestContext, hostPage, guestPage };
}

test('complete mission free action e2e: play NIAC Program, empty hand through real card corners, then complete mission', async ({
  browser,
  request,
}) => {
  test.setTimeout(360_000);
  await waitForServerReady(request);

  const { hostContext, guestContext, hostPage, guestPage } =
    await createStartedTwoPlayerGame(browser);

  try {
    let { actor, other } = await waitForActionOwner(
      hostPage,
      guestPage,
      'PLAY_CARD',
      20_000,
    );

    const [actorHasNiac, otherHasNiac] = await Promise.all([
      hasHandCard(actor, NIAC_PROGRAM_CARD_ID),
      hasHandCard(other, NIAC_PROGRAM_CARD_ID),
    ]);

    expect(actorHasNiac || otherHasNiac).toBe(true);

    if (!actorHasNiac && otherHasNiac) {
      await clickPassAndWaitForLogSync(actor, other);
      ({ actor, other } = await waitForActionOwner(
        hostPage,
        guestPage,
        'PLAY_CARD',
        20_000,
      ));
    }

    await expect
      .poll(() => hasHandCard(actor, NIAC_PROGRAM_CARD_ID), {
        timeout: 10_000,
      })
      .toBe(true);

    const scoreBefore = await resourceValue(actor, 'score');
    const handBeforePlay = await handCount(actor);

    await clickMainAction(actor, 'PLAY_CARD');
    await expect(actor.locator('[data-testid="hand-dock"]')).toHaveAttribute(
      'data-expanded',
      'true',
      { timeout: 10_000 },
    );
    await actor.locator(sel.handCard(NIAC_PROGRAM_CARD_ID)).click();

    await expect
      .poll(() => handCount(actor), { timeout: 15_000 })
      .toBeGreaterThan(handBeforePlay);

    await resolveVisiblePromptBySkippingMissionClaim(actor);
    await expect(
      actor.locator('[data-testid="action-menu-end-turn"]'),
    ).toBeEnabled({
      timeout: 10_000,
    });

    for (
      let discardCount = 0;
      discardCount < MAX_CORNER_DISCARDS;
      discardCount += 1
    ) {
      if ((await handCount(actor)) === 0) {
        break;
      }
      await discardFirstHandCardByCorner(actor);
    }
    await expect.poll(() => handCount(actor), { timeout: 10_000 }).toBe(0);
    await closeCardDetailIfOpen(actor);

    await openExpandedFreeActions(actor);
    await expect(actor.locator(sel.freeAction('COMPLETE_MISSION'))).toBeEnabled(
      {
        timeout: 10_000,
      },
    );
    await actor.locator(sel.freeAction('COMPLETE_MISSION')).click();

    await expect.poll(() => handCount(actor), { timeout: 15_000 }).toBe(1);
    await expect
      .poll(() => resourceValue(actor, 'score'), { timeout: 15_000 })
      .toBe(scoreBefore);
    await expect(
      actor.locator(sel.freeAction('COMPLETE_MISSION')),
    ).toBeDisabled({
      timeout: 10_000,
    });
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});
