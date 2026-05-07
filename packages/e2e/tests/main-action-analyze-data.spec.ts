import { expect, type Page, test } from '@playwright/test';
import {
  clickEndTurn,
  clickInputOptionById,
  clickMainAction,
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

const ANALYZE_DATA_SEED = 'analyze-e2e-1055';
const PROXIMA_CENTAURI_OBSERVATION = '37';

async function resourceValue(page: Page, id: string): Promise<number> {
  const text = await page
    .locator(`[data-testid="resource-${id}"] .readout`)
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

async function dataPoolCount(page: Page): Promise<number> {
  const text = await page
    .locator('[data-testid="data-pool-view"] .readout')
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

async function handCount(page: Page): Promise<number> {
  const text = await page
    .locator('[data-testid="hand-dock"]')
    .locator('text=/\\d+ cards?/')
    .first()
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

async function useFirstCardCorner(page: Page): Promise<void> {
  await openExpandedFreeActions(page);
  const corner = page.locator(sel.freeAction('USE_CARD_CORNER'));
  await expect(corner).toBeEnabled({ timeout: 10_000 });
  const handBefore = await handCount(page);
  const dataBefore = await dataPoolCount(page);

  await corner.click();
  if (handBefore === 1) {
    await expect
      .poll(() => handCount(page), { timeout: 15_000 })
      .toBe(handBefore - 1);
    await expect
      .poll(() => dataPoolCount(page), { timeout: 15_000 })
      .toBe(dataBefore + 1);
    return;
  }

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

  await expect
    .poll(() => handCount(page), { timeout: 15_000 })
    .toBe(handBefore - 1);
  await expect
    .poll(() => dataPoolCount(page), { timeout: 15_000 })
    .toBe(dataBefore + 1);
}

async function placeDataInNextTopSlot(
  page: Page,
  slotIndex: number,
): Promise<void> {
  const poolBefore = await dataPoolCount(page);
  const slot = page.locator(sel.computerSlotTop(slotIndex));
  await expect(slot).toBeEnabled({ timeout: 10_000 });
  await slot.click();
  await expect
    .poll(() => dataPoolCount(page), { timeout: 15_000 })
    .toBe(poolBefore - 1);
  await expect(slot).toBeDisabled({ timeout: 10_000 });
}

test('@actions @real-ui analyze data main action e2e: fill computer through real UI, analyze, and place blue trace', async ({
  browser,
  request,
}) => {
  test.setTimeout(300_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('analyze-data-host');
  const guest = createUser('analyze-data-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(
      hostPage,
      `Analyze Data Room ${Date.now()}`,
      2,
      { seed: ANALYZE_DATA_SEED },
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
      20_000,
    );
    await expect(
      actor.locator(sel.handCard(PROXIMA_CENTAURI_OBSERVATION)),
    ).toBeVisible({
      timeout: 10_000,
    });

    await clickMainAction(actor, 'PLAY_CARD');
    await expect(actor.locator('[data-testid="hand-dock"]')).toHaveAttribute(
      'data-expanded',
      'true',
      { timeout: 10_000 },
    );

    const dataBeforeCard = await dataPoolCount(actor);
    await actor.locator(sel.handCard(PROXIMA_CENTAURI_OBSERVATION)).click();
    await expect
      .poll(() => dataPoolCount(actor), { timeout: 15_000 })
      .toBe(dataBeforeCard + 2);

    for (let i = 0; i < 4; i += 1) {
      await useFirstCardCorner(actor);
    }
    await expect.poll(() => dataPoolCount(actor), { timeout: 10_000 }).toBe(6);

    for (let slotIndex = 0; slotIndex < 6; slotIndex += 1) {
      await placeDataInNextTopSlot(actor, slotIndex);
    }
    await expect.poll(() => dataPoolCount(actor), { timeout: 10_000 }).toBe(0);

    await clickEndTurn(actor);
    await waitForActionHandoff(actor, other, 'PASS', 20_000);
    await clickPassAndWaitForLogSync(other, actor);

    const energyBeforeAnalyze = await resourceValue(actor, 'energy');
    await expect(actor.locator(sel.actionMenu('ANALYZE_DATA'))).toBeEnabled({
      timeout: 20_000,
    });
    await clickMainAction(actor, 'ANALYZE_DATA');

    await expect
      .poll(() => resourceValue(actor, 'energy'), { timeout: 15_000 })
      .toBe(energyBeforeAnalyze - 1);
    await clickInputOptionById(actor, 'alien-0-discovery-blue-trace');
    await expect(
      actor.locator('[data-testid="action-menu-end-turn"]'),
    ).toBeEnabled({
      timeout: 10_000,
    });
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});
