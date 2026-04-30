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

async function resolveCardPromptIfVisible(
  page: Page,
  timeoutMs = 8_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const eorCardPrompt = page
      .locator('[data-testid="bottom-actions"] [data-testid^="input-eor-card-"]')
      .first();
    const eorVisible = await eorCardPrompt.isVisible().catch(() => false);

    if (eorVisible) {
      await eorCardPrompt.click();
      return true;
    }

    const cardPrompt = page
      .locator(
        '[data-testid="bottom-actions"] [data-testid^="hand-card-"],' +
          '[data-testid="bottom-actions"] [data-testid^="select-card-"]',
      )
      .first();
    const visible = await cardPrompt.isVisible().catch(() => false);

    if (visible) {
      await cardPrompt.click();
      const confirmBtn = page
        .locator('[data-testid="bottom-actions"]')
        .getByRole('button', { name: /^confirm$/i });
      await confirmBtn.scrollIntoViewIfNeeded().catch(() => undefined);
      await expect(confirmBtn).toBeEnabled({ timeout: 5_000 });
      await confirmBtn.click();
      return true;
    }

    const anyAction = page.locator('[data-testid^="action-menu-"]').first();
    const anyActionVisible = await anyAction.isVisible().catch(() => false);
    if (anyActionVisible) {
      return false;
    }

    await page.waitForTimeout(150);
  }

  return false;
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

  if (playerCount !== 2) {
    const playerCountTrigger = page.locator('#player-count');
    await expect(playerCountTrigger).toBeVisible({ timeout: 10_000 });
    await playerCountTrigger.click();

    const playerCountOption = page.getByRole('option', {
      name: new RegExp(`^${playerCount}\\b`),
    });
    await expect(playerCountOption).toBeVisible({ timeout: 10_000 });
    await playerCountOption.click();
  }

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
  expect(response.ok()).toBe(true);

  const body = (await response.json()) as { id?: string };
  expect(body.id).toBeTruthy();
  await page.waitForURL(new RegExp(`/room/${body.id as string}$`), {
    timeout: 15_000,
  });
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
  await resolveCardPromptIfVisible(page);
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
  await resolveCardPromptIfVisible(page);
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
  await expect
    .poll(
      async () => {
        const [firstState, secondState] = await Promise.all([
          getActionAvailability(firstPage, actionType),
          getActionAvailability(secondPage, actionType),
        ]);

        if (firstState === 'enabled' && secondState === 'enabled') {
          return 'both';
        }
        if (firstState === 'enabled') return 'first';
        if (secondState === 'enabled') return 'second';
        return 'none';
      },
      {
        timeout,
        message: `Timed out waiting for action-menu-${actionType} to become enabled on either page`,
      },
    )
    .not.toBe('none');

  const firstState = await getActionAvailability(firstPage, actionType);
  if (firstState === 'enabled') {
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
  await expect
    .poll(
      async () => {
        const [previousState, nextState] = await Promise.all([
          getActionAvailability(previousActor, actionType),
          getActionAvailability(nextActor, actionType),
        ]);

        if (previousState !== 'enabled' && nextState === 'enabled') {
          return 'handoff';
        }
        if (previousState === 'enabled' && nextState !== 'enabled') {
          return 'stale-previous';
        }
        if (previousState !== 'enabled' && nextState !== 'enabled') {
          return 'neither';
        }
        return 'both';
      },
      {
        timeout,
        message: `Timed out waiting for action-menu-${actionType} to hand off via enabled state to the other player`,
      },
    )
    .toBe('handoff');
}

type TActionAvailability = 'enabled' | 'disabled' | 'hidden';

async function getActionAvailability(
  page: Page,
  actionType: string,
): Promise<TActionAvailability> {
  const action = page.locator(sel.actionMenu(actionType));
  const visible = await action.isVisible().catch(() => false);

  if (!visible) {
    return 'hidden';
  }

  const enabled = await action.isEnabled().catch(() => false);
  return enabled ? 'enabled' : 'disabled';
}

export async function clickPassAndWaitForLogSync(
  actorPage: Page,
  otherPage: Page,
): Promise<void> {
  await openEventLog(actorPage);
  await openEventLog(otherPage);

  const actorPass = actorPage.locator(sel.actionMenu('PASS'));
  const actorLog = actorPage.locator('[data-testid^="event-entry-"]');
  const otherLog = otherPage.locator('[data-testid^="event-entry-"]');

  const actorBefore = await actorLog.count();
  const otherBefore = await otherLog.count();

  await expect(actorPass).toBeVisible({ timeout: 10_000 });
  await actorPass.click();

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const resolvedActorPrompt = await resolveCardPromptIfVisible(actorPage, 300);
    const resolvedOtherPrompt = await resolveCardPromptIfVisible(otherPage, 300);

    if (resolvedActorPrompt || resolvedOtherPrompt) {
      continue;
    }

    const [actorLogCount, otherLogCount, actorState, otherState] =
      await Promise.all([
        actorLog.count(),
        otherLog.count(),
        getActionAvailability(actorPage, 'PASS'),
        getActionAvailability(otherPage, 'PASS'),
      ]);

    if (
      actorLogCount > actorBefore &&
      otherLogCount > otherBefore &&
      actorState !== 'enabled' &&
      otherState === 'enabled'
    ) {
      return;
    }

    await actorPage.waitForTimeout(150);
  }

  throw new Error('Timed out waiting for PASS to sync via log update, prompt resolution, or turn handoff');
}

export async function openEventLog(page: Page): Promise<void> {
  const eventLog = page.locator(sel.eventLog);
  const alreadyVisible = await eventLog.isVisible().catch(() => false);
  if (alreadyVisible) {
    return;
  }

  const eventLogToggle = page.getByRole('button', { name: /event log/i });
  await expect(eventLogToggle).toBeVisible({ timeout: 10_000 });
  await eventLogToggle.click();
  await expect(eventLog).toBeVisible({ timeout: 10_000 });
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
 * Click the explicit End Turn button shown during the AWAIT_END_TURN phase.
 * Non-PASS main actions leave the turn open so players can still take free
 * actions — the turn only closes once End Turn is triggered.
 */
export async function clickEndTurn(page: Page): Promise<void> {
  const endTurnBtn = page.locator('[data-testid="action-menu-end-turn"]');
  await expect(endTurnBtn).toBeVisible({ timeout: 10_000 });
  await expect(endTurnBtn).toBeEnabled({ timeout: 5_000 });
  await endTurnBtn.click();
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
      .locator(
        '[data-testid="bottom-actions"] [data-testid^="input-"],' +
          '[data-testid="bottom-actions"] [data-testid^="hand-card-"],' +
          '[data-testid="bottom-actions"] [data-testid^="select-card-"],' +
          '[data-testid="bottom-actions"] [data-testid^="input-eor-card-"]',
      )
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
  const card = page
    .locator('[data-testid^="hand-card-"], [data-testid^="select-card-"]')
    .first();
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
          '[data-testid="bottom-actions"] [data-testid^="select-card-"],' +
          '[data-testid="bottom-actions"] [data-testid^="hand-card-"]',
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

    const actionCard = page
      .locator(
        '[data-testid="bottom-actions"] [data-testid^="hand-card-"],' +
          '[data-testid="bottom-actions"] [data-testid^="select-card-"]',
      )
      .first();
    const isActionCardVisible = await actionCard.isVisible().catch(() => false);
    if (isActionCardVisible) {
      await actionCard.click();
      const actionConfirm = page
        .locator('[data-testid="bottom-actions"]')
        .getByRole('button', { name: /confirm/i });
      await actionConfirm.scrollIntoViewIfNeeded().catch(() => undefined);
      await expect(actionConfirm).toBeEnabled({ timeout: 5_000 });
      await actionConfirm.click();
      await page.waitForTimeout(500);
      continue;
    }

    const handCard = page
      .locator('[data-testid="bottom-hand"] [data-testid^="hand-card-"]')
      .first();
    const isHandCardVisible = await handCard.isVisible().catch(() => false);
    if (isHandCardVisible) {
      await handCard.click();
      const handConfirm = page
        .locator('[data-testid="bottom-hand"]')
        .getByRole('button', { name: /^confirm$/i });
      await handConfirm.scrollIntoViewIfNeeded().catch(() => undefined);
      await expect(handConfirm).toBeEnabled({ timeout: 5_000 });
      await handConfirm.click();
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
