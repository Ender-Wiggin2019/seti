import { expect, test, type Browser, type Page } from '@playwright/test';
import { baseCards } from '@seti/common/data/baseCards';
import { EResource } from '@seti/common/types/element';
import {
  clickPassAndWaitForLogSync,
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  waitForActionHandoff,
  waitForActionOwner,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const BASE_CARD_BY_ID = new Map(baseCards.map((card) => [card.id, card]));

async function resourceValue(page: Page, id: string) {
  const text = await page
    .locator(`[data-testid="resource-${id}"] .readout`)
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

async function handCount(page: Page) {
  const text = await page
    .locator('[data-testid="hand-dock"]')
    .locator('text=/\\d+ cards?/')
    .first()
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

async function publicityCornerCardTestIds(page: Page): Promise<string[]> {
  const cardButtons = page.locator(
    '[data-testid="bottom-hand"] [data-testid^="hand-card-"]',
  );
  const count = await cardButtons.count();
  const testIds: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const testId = await cardButtons.nth(index).getAttribute('data-testid');
    const cardId = testId?.replace('hand-card-', '');
    if (!testId || !cardId) continue;

    const card = BASE_CARD_BY_ID.get(cardId);
    if (
      card?.freeAction?.some(
        (reward) =>
          reward.type === EResource.PUBLICITY && reward.value > 0,
      )
    ) {
      testIds.push(testId);
    }
  }

  return testIds;
}

async function openExpandedFreeActions(page: Page): Promise<void> {
  const corner = page.locator(sel.freeAction('USE_CARD_CORNER'));
  if (!(await corner.isVisible().catch(() => false))) {
    await page.locator(sel.freeActionToggle).click();
  }
  await expect(corner).toBeVisible({ timeout: 10_000 });
}

async function useCardCorner(page: Page, cardTestId: string): Promise<void> {
  await openExpandedFreeActions(page);
  const corner = page.locator(sel.freeAction('USE_CARD_CORNER'));
  await expect(corner).toBeEnabled({ timeout: 10_000 });
  await corner.click();
  await expect(page.locator('[data-testid="hand-dock"]')).toHaveAttribute(
    'data-expanded',
    'true',
    { timeout: 10_000 },
  );
  const card = page.locator(`[data-testid="${cardTestId}"]`);
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();
}

async function setupTwoPlayerGame(browser: Browser): Promise<{
  hostContext: Awaited<ReturnType<Browser['newContext']>>;
  guestContext: Awaited<ReturnType<Browser['newContext']>>;
  hostPage: Page;
  guestPage: Page;
}> {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('research-host');
  const guest = createUser('research-guest');

  await registerByUi(hostPage, host);
  await registerByUi(guestPage, guest);

  const roomId = await createRoomByUi(
    hostPage,
    `Research Tech Room ${Date.now()}`,
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

  return { hostContext, guestContext, hostPage, guestPage };
}

test('research tech main action e2e: active player gains publicity via card corners, then researches tech through real UI', async ({
  browser,
  request,
}) => {
  test.setTimeout(360_000);
  await waitForServerReady(request);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { hostContext, guestContext, hostPage, guestPage } =
      await setupTwoPlayerGame(browser);

    try {
      let { actor, other } = await waitForActionOwner(
        hostPage,
        guestPage,
        'PASS',
      );
      let cornerCards = await publicityCornerCardTestIds(actor);

      if (cornerCards.length < 2) {
        await clickPassAndWaitForLogSync(actor, other);
        await waitForActionHandoff(actor, other, 'PASS', 20_000);
        [actor, other] = [other, actor];
        cornerCards = await publicityCornerCardTestIds(actor);
      }

      if (cornerCards.length < 2) {
        continue;
      }

      const initialPublicity = await resourceValue(actor, 'publicity');
      expect(initialPublicity).toBe(4);
      const initialHandCount = await handCount(actor);

      await useCardCorner(actor, cornerCards[0]);
      await expect
        .poll(() => resourceValue(actor, 'publicity'), { timeout: 15_000 })
        .toBe(initialPublicity + 1);

      const nextCornerCards = await publicityCornerCardTestIds(actor);
      expect(nextCornerCards.length).toBeGreaterThan(0);
      await useCardCorner(actor, nextCornerCards[0]);
      await expect
        .poll(() => resourceValue(actor, 'publicity'), { timeout: 15_000 })
        .toBe(initialPublicity + 2);
      await expect
        .poll(() => handCount(actor), { timeout: 15_000 })
        .toBe(initialHandCount - 2);

      const research = actor.locator(sel.actionMenu('RESEARCH_TECH'));
      await expect(research).toBeVisible({ timeout: 10_000 });
      await expect(research).toBeEnabled({ timeout: 10_000 });
      await research.click();

      const probeStack = actor.locator(sel.techStack('probe-tech', 0));
      await expect(probeStack).toBeVisible({ timeout: 10_000 });
      await expect(probeStack).toHaveAttribute('role', 'button', {
        timeout: 10_000,
      });
      await probeStack.click();

      await expect
        .poll(() => resourceValue(actor, 'publicity'), { timeout: 15_000 })
        .toBeLessThan(initialPublicity + 2);
      await expect(actor.locator('[data-testid="action-menu-end-turn"]')).toBeEnabled({
        timeout: 10_000,
      });
      return;
    } finally {
      await hostContext.close().catch(() => undefined);
      await guestContext.close().catch(() => undefined);
    }
  }

  throw new Error(
    'Could not find a real UI game where either player had two publicity-corner cards after setup',
  );
});
