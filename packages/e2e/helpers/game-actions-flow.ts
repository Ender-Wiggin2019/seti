import { expect, type Page } from '@playwright/test';
import { resolveCardPromptIfVisible } from './prompt-resolvers';
import { sel } from './selectors';

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
  const actionBtn = page.locator(sel.actionMenu(actionType));
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
