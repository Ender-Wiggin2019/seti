import { expect, type Locator, type Page } from '@playwright/test';
import {
  resolveCardPromptIfVisible,
  resolveVisibleCardPrompt,
} from './prompt-resolvers';
import { sel } from './selectors';

export async function waitForActionOwner(
  firstPage: Page,
  secondPage: Page,
  actionType: string,
  timeout = 15_000,
): Promise<{ actor: Page; other: Page }> {
  const intervalMs = 150;
  const deadline = performance.now() + timeout;
  let lastState = 'not checked';

  while (performance.now() < deadline) {
    let [firstState, secondState] = await Promise.all([
      getActionAvailability(firstPage, actionType),
      getActionAvailability(secondPage, actionType),
    ]);
    lastState = `first=${firstState}, second=${secondState}`;

    if (firstState === 'enabled') {
      return { actor: firstPage, other: secondPage };
    }
    if (secondState === 'enabled') {
      return { actor: secondPage, other: firstPage };
    }

    if (performance.now() >= deadline) {
      break;
    }
    await Promise.all([
      resolveVisibleCardPrompt(firstPage),
      resolveVisibleCardPrompt(secondPage),
    ]);
    [firstState, secondState] = await Promise.all([
      getActionAvailability(firstPage, actionType),
      getActionAvailability(secondPage, actionType),
    ]);
    lastState = `first=${firstState}, second=${secondState}`;

    if (firstState === 'enabled') {
      return { actor: firstPage, other: secondPage };
    }
    if (secondState === 'enabled') {
      return { actor: secondPage, other: firstPage };
    }

    const remainingMs = deadline - performance.now();
    if (remainingMs <= 0) {
      break;
    }
    await sleep(Math.min(intervalMs, remainingMs));
  }

  throw new Error(
    `Timed out waiting for action-menu-${actionType} to become enabled on either page (${lastState})`,
  );
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
  return page
    .evaluate((testId) => {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          `[data-testid="${testId}"]`,
        ),
      );
      const visible = elements.filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        );
      });

      if (visible.length === 0) {
        return 'hidden';
      }

      return visible.some(
        (element) =>
          !element.hasAttribute('disabled') &&
          element.getAttribute('aria-disabled') !== 'true',
      )
        ? 'enabled'
        : 'disabled';
    }, `action-menu-${actionType}`)
    .catch(() => 'hidden') as Promise<TActionAvailability>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function firstVisibleAction(
  page: Page,
  actionType: string,
): Promise<Locator | null> {
  const actions = page.locator(sel.actionMenu(actionType));
  const count = await actions.count().catch(() => 0);

  for (let index = 0; index < count; index += 1) {
    const action = actions.nth(index);
    if (await action.isVisible().catch(() => false)) {
      return action;
    }
  }

  return null;
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
    const resolvedActorPrompt = await resolveCardPromptIfVisible(
      actorPage,
      300,
    );
    const resolvedOtherPrompt = await resolveCardPromptIfVisible(
      otherPage,
      300,
    );

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

  throw new Error(
    'Timed out waiting for PASS to sync via log update, prompt resolution, or turn handoff',
  );
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

export async function clickMainAction(
  page: Page,
  actionType: string,
): Promise<void> {
  const actionBtn =
    (await firstVisibleAction(page, actionType)) ??
    page.locator(sel.actionMenu(actionType)).first();
  await expect(actionBtn).toBeVisible({ timeout: 10_000 });
  await expect(actionBtn).toBeEnabled({ timeout: 5_000 });
  await actionBtn.click();
}

export async function clickEndTurn(page: Page): Promise<void> {
  const endTurnBtn = page.locator('[data-testid="action-menu-end-turn"]');
  await expect(endTurnBtn).toBeVisible({ timeout: 10_000 });
  await expect(endTurnBtn).toBeEnabled({ timeout: 5_000 });
  await endTurnBtn.click();
}
