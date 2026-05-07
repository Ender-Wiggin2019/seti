import { expect, type Page, test } from '@playwright/test';
import { baseCards } from '@seti/common/data/baseCards';
import { EResource } from '@seti/common/types/element';
import {
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

async function playableHandCardTestId(page: Page): Promise<string> {
  const [credits, energy, publicity] = await Promise.all([
    resourceValue(page, 'credit'),
    resourceValue(page, 'energy'),
    resourceValue(page, 'publicity'),
  ]);
  const data = 0;

  const cardButtons = page.locator(
    '[data-testid="bottom-hand"] [data-testid^="hand-card-"]',
  );
  const count = await cardButtons.count();
  for (let index = 0; index < count; index += 1) {
    const button = cardButtons.nth(index);
    const testId = await button.getAttribute('data-testid');
    const cardId = testId?.replace('hand-card-', '');
    if (!testId || !cardId) continue;

    const card = BASE_CARD_BY_ID.get(cardId);
    if (!card) continue;

    const price = card.price;
    const priceType = card.priceType ?? EResource.CREDIT;
    const affordable =
      (priceType === EResource.CREDIT && credits >= price) ||
      (priceType === EResource.ENERGY && energy >= price) ||
      (priceType === EResource.PUBLICITY && publicity >= price) ||
      (priceType === EResource.DATA && data >= price);
    if (affordable) {
      return testId;
    }
  }

  throw new Error('No affordable base card found in the active player hand');
}

test('@actions @real-ui play card main action e2e: active player selects an affordable hand card through real UI', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('play-card-host');
  const guest = createUser('play-card-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(
      hostPage,
      `Play Card Room ${Date.now()}`,
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
      'PLAY_CARD',
    );
    const initialHandCount = await handCount(actor);
    expect(initialHandCount).toBeGreaterThan(0);

    await actor.locator(sel.actionMenu('PLAY_CARD')).click();
    await expect(actor.locator('[data-testid="hand-dock"]')).toHaveAttribute(
      'data-expanded',
      'true',
      { timeout: 10_000 },
    );

    const cardTestId = await playableHandCardTestId(actor);
    await actor.locator(`[data-testid="${cardTestId}"]`).click();

    await expect
      .poll(() => handCount(actor), { timeout: 15_000 })
      .toBeLessThan(initialHandCount);

    await expect
      .poll(
        async () => {
          const endTurnVisible = await actor
            .locator('[data-testid="action-menu-end-turn"]')
            .isVisible()
            .catch(() => false);
          if (endTurnVisible) return 'end-turn';

          const hasPrompt = await actor
            .locator(
              '[data-testid="bottom-actions"] [data-testid^="input-"],' +
                '[data-testid="bottom-actions"] [data-testid^="hand-card-"],' +
                '[data-testid="bottom-actions"] [data-testid^="select-card-"]',
            )
            .first()
            .isVisible()
            .catch(() => false);
          if (hasPrompt) return 'input';

          const otherPassEnabled = await other
            .locator(sel.actionMenu('PASS'))
            .isEnabled()
            .catch(() => false);
          const actorPassEnabled = await actor
            .locator(sel.actionMenu('PASS'))
            .isEnabled()
            .catch(() => false);
          if (otherPassEnabled && !actorPassEnabled) return 'handoff';

          return 'pending';
        },
        { timeout: 15_000 },
      )
      .not.toBe('pending');
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});
