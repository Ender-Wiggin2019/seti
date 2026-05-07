import { expect, type Page, test } from '@playwright/test';
import {
  clickMainAction,
  clickPassAndWaitForLogSync,
  createStartedGameByUi,
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

test('@actions @real-ui complete mission free action e2e: play NIAC Program, empty hand through real card corners, then complete mission', async ({
  browser,
  request,
}) => {
  test.setTimeout(360_000);
  await waitForServerReady(request);

  const game = await createStartedGameByUi(browser, {
    roomName: `Complete Mission Room ${Date.now()}`,
    userPrefix: 'complete-mission',
    roomOptions: { seed: SEEDED_NIAC_GAME },
  });
  const [hostPage, guestPage] = game.pages;

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
    await game.close();
  }
});
