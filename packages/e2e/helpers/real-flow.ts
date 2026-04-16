import { expect, type Page } from '@playwright/test';
import { sel } from './selectors';

export interface IUserCred {
  name: string;
  email: string;
  password: string;
}

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createUser(prefix: string): IUserCred {
  const suffix = uniqueSuffix();
  return {
    name: `${prefix}-${suffix}`,
    email: `${prefix.toLowerCase()}-${suffix}@e2e.test`,
    password: 'password123',
  };
}

export async function registerByUi(page: Page, user: IUserCred): Promise<void> {
  await page.goto('/auth');
  await page.getByRole('tab').nth(1).click();
  await expect(page.locator('#reg-name')).toBeVisible({ timeout: 10_000 });
  await page.locator('#reg-name').fill(user.name);
  await page.locator('#reg-email').fill(user.email);
  await page.locator('#reg-password').fill(user.password);

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/auth/register') && res.request().method() === 'POST',
    { timeout: 15_000 },
  );
  await page.getByTestId('auth-register-submit').click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);

  await page.waitForURL('**/lobby', { timeout: 15_000 });
}

export async function loginByUi(page: Page, user: IUserCred): Promise<void> {
  await page.goto('/auth');
  await page.getByRole('tab').nth(0).click();
  await expect(page.locator('#login-email')).toBeVisible({ timeout: 10_000 });
  await page.locator('#login-email').fill(user.email);
  await page.locator('#login-password').fill(user.password);

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/auth/login') && res.request().method() === 'POST',
    { timeout: 15_000 },
  );
  await page.getByTestId('auth-login-submit').click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);

  await page.waitForURL('**/lobby', { timeout: 15_000 });
}

export async function createRoomByUi(
  page: Page,
  roomName: string,
  playerCount: 2 | 3 | 4,
): Promise<string> {
  await page.goto('/lobby');
  await page.getByTestId('lobby-new-mission').click();
  await expect(page.getByTestId('create-room-dialog')).toBeVisible({
    timeout: 10_000,
  });
  await page.locator('#room-name').fill(roomName);

  const playerCountTrigger = page.locator('#player-count');
  await expect(playerCountTrigger).toBeVisible({ timeout: 10_000 });
  await playerCountTrigger.click();

  const playerCountOptionByText = page
    .getByRole('option')
    .filter({ hasText: new RegExp(`\\b${playerCount}\\b`) })
    .first();
  if ((await playerCountOptionByText.count()) > 0) {
    await playerCountOptionByText.click();
  } else {
    const fallbackIndex = playerCount - 2;
    await page.getByRole('option').nth(fallbackIndex).click();
  }

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/lobby/rooms') && res.request().method() === 'POST',
  );
  await page.getByTestId('create-room-submit').click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);

  const body = (await response.json()) as { id?: string };
  expect(body.id).toBeTruthy();
  return body.id as string;
}

export async function joinRoomByUi(page: Page, roomId: string): Promise<void> {
  await page.goto(`/room/${roomId}`);
  const joinBtn = page.getByTestId('room-join');
  await expect(joinBtn).toBeVisible({ timeout: 15_000 });

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/lobby/rooms/${roomId}/join`) &&
      res.request().method() === 'POST',
  );
  await joinBtn.click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
}

export async function launchGameByUi(
  page: Page,
  roomId: string,
): Promise<string> {
  await page.goto(`/room/${roomId}`);
  const launchBtn = page.getByTestId('room-launch-game');
  await expect(launchBtn).toBeVisible({ timeout: 15_000 });

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/lobby/rooms/${roomId}/start`) &&
      res.request().method() === 'POST',
  );
  await launchBtn.click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);

  await page.waitForURL(/\/game\/[^/?#]+$/, { timeout: 15_000 });
  const gameId = page.url().split('/game/')[1]?.split(/[?#]/)[0];
  expect(gameId).toBeTruthy();
  return gameId as string;
}

export async function enterGameByUi(
  page: Page,
  roomId: string,
): Promise<string> {
  await page.goto(`/room/${roomId}`);
  const enterBtn = page.getByTestId('room-enter-game');
  await expect(enterBtn).toBeVisible({ timeout: 15_000 });
  await enterBtn.click();

  await page.waitForURL(/\/game\/[^/?#]+$/, { timeout: 15_000 });
  const gameId = page.url().split('/game/')[1]?.split(/[?#]/)[0];
  expect(gameId).toBeTruthy();
  return gameId as string;
}

export async function waitForActionOwner(
  firstPage: Page,
  secondPage: Page,
  actionType: string,
  timeout = 15_000,
): Promise<{ actor: Page; other: Page }> {
  const firstAction = firstPage.locator(sel.actionMenu(actionType));
  const secondAction = secondPage.locator(sel.actionMenu(actionType));

  await expect
    .poll(
      async () => {
        const [firstVisible, secondVisible] = await Promise.all([
          firstAction.isVisible().catch(() => false),
          secondAction.isVisible().catch(() => false),
        ]);

        if (firstVisible) return 'first';
        if (secondVisible) return 'second';
        return 'none';
      },
      {
        timeout,
        message: `Timed out waiting for action-menu-${actionType} to appear on either page`,
      },
    )
    .not.toBe('none');

  const firstVisible = await firstAction.isVisible().catch(() => false);
  if (firstVisible) {
    return { actor: firstPage, other: secondPage };
  }
  return { actor: secondPage, other: firstPage };
}

export async function waitForActionHandoff(
  previousActor: Page,
  nextActor: Page,
  actionType: string,
  timeout = 15_000,
): Promise<void> {
  const previousAction = previousActor.locator(sel.actionMenu(actionType));
  const nextAction = nextActor.locator(sel.actionMenu(actionType));

  await expect
    .poll(
      async () => {
        const [previousVisible, nextVisible] = await Promise.all([
          previousAction.isVisible().catch(() => false),
          nextAction.isVisible().catch(() => false),
        ]);

        if (!previousVisible && nextVisible) return 'handoff';
        if (previousVisible && !nextVisible) return 'stale-previous';
        if (!previousVisible && !nextVisible) return 'neither';
        return 'both';
      },
      {
        timeout,
        message: `Timed out waiting for action-menu-${actionType} to hand off to the other player`,
      },
    )
    .toBe('handoff');
}

export async function clickPassAndWaitForLogSync(
  actorPage: Page,
  otherPage: Page,
): Promise<void> {
  const actorPass = actorPage.locator(sel.actionMenu('PASS'));
  const actorLog = actorPage.locator('[data-testid^="event-entry-"]');
  const otherLog = otherPage.locator('[data-testid^="event-entry-"]');

  const actorBefore = await actorLog.count();
  const otherBefore = await otherLog.count();

  await expect(actorPass).toBeVisible({ timeout: 10_000 });
  await actorPass.click();

  await expect
    .poll(async () => actorLog.count(), { timeout: 10_000 })
    .toBeGreaterThan(actorBefore);
  await expect
    .poll(async () => otherLog.count(), { timeout: 10_000 })
    .toBeGreaterThan(otherBefore);
}

/**
 * Click a main action button and wait for the game state to update
 * (either a new input prompt appears or the action menu re-renders).
 */
export async function clickMainAction(
  page: Page,
  actionType: string,
): Promise<void> {
  const actionBtn = page.locator(sel.actionMenu(actionType));
  await expect(actionBtn).toBeVisible({ timeout: 10_000 });
  await expect(actionBtn).toBeEnabled({ timeout: 5_000 });
  await actionBtn.click();
}

/**
 * Wait for any input prompt to become visible in the bottom-actions panel.
 * Returns true if an input prompt appeared.
 */
export async function waitForInputPrompt(
  page: Page,
  timeout = 10_000,
): Promise<boolean> {
  try {
    await page
      .locator('[data-testid="bottom-actions"] [data-testid^="input-"]')
      .first()
      .waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Click the first visible input option button (for SelectOptionInput prompts).
 * Optionally filter by a partial optionId match.
 */
export async function clickFirstInputOption(
  page: Page,
  partialId?: string,
): Promise<void> {
  const selector = partialId
    ? `[data-testid*="input-option-"][data-testid*="${partialId}"]`
    : '[data-testid^="input-option-"]';
  const option = page.locator(selector).first();
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
}

/**
 * Click a specific input option by its exact ID.
 */
export async function clickInputOptionById(
  page: Page,
  optionId: string,
): Promise<void> {
  const option = page.locator(sel.inputOption(optionId));
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
}

/**
 * Click a card in a card-selection prompt (data-testid="select-card-{cardId}").
 */
export async function clickFirstSelectCard(page: Page): Promise<void> {
  const card = page.locator('[data-testid^="select-card-"]').first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();
}

/**
 * Wait for any interactive prompt (input options, card selection, sector selection)
 * to become visible in the bottom-actions panel.
 */
async function waitForAnyPrompt(page: Page, timeout = 5_000): Promise<boolean> {
  try {
    await page
      .locator(
        '[data-testid="bottom-actions"] [data-testid^="input-"],' +
          '[data-testid="bottom-actions"] [data-testid^="select-card-"]',
      )
      .first()
      .waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve all scan sub-action prompts by executing real sub-actions first,
 * then clicking Done when only Done remains.
 *
 * Priority per step:
 *  1. Click a real sub-action option (mark-earth, mark-card-row, …) — skip "done"
 *  2. If a card-selection prompt appears, pick the first card and confirm
 *  3. If only "done" is left, click it to finish the scan
 */
export async function resolveScanSubActions(
  page: Page,
  maxSteps = 10,
): Promise<void> {
  for (let step = 0; step < maxSteps; step++) {
    const hasPrompt = await waitForAnyPrompt(page, 5_000);
    if (!hasPrompt) return;

    const realOption = page
      .locator(
        '[data-testid^="input-option-"]:not([data-testid="input-option-done"])',
      )
      .first();
    const hasRealOption = await realOption.isVisible().catch(() => false);
    if (hasRealOption) {
      await realOption.click();
      await page.waitForTimeout(500);
      continue;
    }

    const anyCard = page.locator('[data-testid^="select-card-"]').first();
    const isCardVisible = await anyCard.isVisible().catch(() => false);
    if (isCardVisible) {
      await anyCard.click();
      await page.waitForTimeout(300);
      const confirmBtn = page.getByRole('button', { name: /confirm/i });
      const confirmVisible = await confirmBtn.isVisible().catch(() => false);
      if (confirmVisible) {
        await confirmBtn.click();
      }
      await page.waitForTimeout(500);
      continue;
    }

    const doneBtn = page.locator('[data-testid="input-option-done"]');
    const isDoneVisible = await doneBtn.isVisible().catch(() => false);
    if (isDoneVisible) {
      await doneBtn.click();
      return;
    }

    return;
  }
}
