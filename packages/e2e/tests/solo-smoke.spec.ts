import { expect, type Page, test } from '@playwright/test';
import {
  clickMainAction,
  createRoomByUi,
  createUser,
  enterGameByUi,
  launchGameByUi,
  loginByUi,
  openEventLog,
  registerByUi,
  waitForAndResolveCardPrompt,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

type TTabName = 'Board' | 'Planets' | 'Tech' | 'Cards' | 'Aliens' | 'Scoring';

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

async function getRivalPanelSnapshot(page: Page): Promise<string> {
  const activeProgressSlot = page
    .locator('[data-testid^="rival-progress-slot-"][data-current="true"]')
    .first();
  const renderedCurrentCard = page
    .getByTestId('rival-current-card')
    .locator('[data-testid^="rival-action-card-render-S."]')
    .first();

  const [progress, draw, discard, currentCard, activeSlotId, renderedCardId] =
    await Promise.all([
      page.getByTestId('rival-progress').textContent(),
      page.getByTestId('rival-deck-draw').textContent(),
      page.getByTestId('rival-deck-discard').textContent(),
      page.getByTestId('rival-current-card').textContent(),
      activeProgressSlot.getAttribute('data-testid').catch(() => 'none'),
      renderedCurrentCard.getAttribute('data-testid').catch(() => 'none'),
    ]);

  return [progress, draw, discard, currentCard, activeSlotId, renderedCardId]
    .map((value) => normalizeText(value ?? ''))
    .join('|');
}

async function openTab(page: Page, name: TTabName): Promise<void> {
  const tab = page.getByRole('tab', { name });
  await expect(tab).toBeVisible({ timeout: 10_000 });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true', {
    timeout: 10_000,
  });
}

async function eventEntryCount(page: Page): Promise<number> {
  await openEventLog(page);
  return page.locator('[data-testid^="event-entry-"]').count();
}

async function expectNumericReadout(page: Page, testId: string): Promise<void> {
  await expect
    .poll(
      async () => {
        const text = await page.getByTestId(testId).textContent();
        return /^\d+$/.test(normalizeText(text ?? ''));
      },
      { timeout: 10_000 },
    )
    .toBe(true);
}

async function expectGameShell(page: Page): Promise<void> {
  await expect(page.locator(sel.bottomActions)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator(sel.bottomDashboard)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator(sel.bottomHand)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('hand-dock')).toHaveAttribute(
    'data-expanded',
    'true',
    { timeout: 10_000 },
  );

  await expect(page.locator(sel.resourceBar)).toBeVisible({ timeout: 10_000 });
  for (const resourceId of [
    'credit',
    'energy',
    'publicity',
    'signal-token',
    'score',
    'exofossils',
  ]) {
    await expect(page.getByTestId(`resource-${resourceId}`)).toBeVisible({
      timeout: 10_000,
    });
  }
  await expect(page.locator(sel.incomeTracker)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator(sel.dataPoolView)).toBeVisible({
    timeout: 10_000,
  });

  for (const actionType of [
    'PLAY_CARD',
    'LAUNCH_PROBE',
    'SCAN',
    'RESEARCH_TECH',
    'ANALYZE_DATA',
    'PASS',
  ]) {
    await expect(page.locator(sel.actionMenu(actionType))).toBeVisible({
      timeout: 10_000,
    });
  }

  await openTab(page, 'Board');
  await expect(
    page.locator('[data-testid^="solar-space-"]').first(),
  ).toBeVisible({ timeout: 10_000 });

  await openTab(page, 'Cards');
  await expect(page.locator('[data-testid^="card-row-"]').first()).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('[data-testid^="round-stack-"]')).toHaveCount(4);

  await openTab(page, 'Aliens');
  await expect(page.getByTestId('alien-board-grid')).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.locator('[data-testid^="alien-"][data-testid$="-card"]'),
  ).toHaveCount(2);
  await expect(
    page.locator('[data-testid^="alien-"][data-testid$="-discovery-zone"]'),
  ).toHaveCount(2);
  await expect(
    page.locator('[data-testid^="alien-"][data-testid$="-overflow-zone"]'),
  ).toHaveCount(2);

  await openEventLog(page);
  await expect(page.locator(sel.eventLog)).toBeVisible({ timeout: 10_000 });
}

async function expectRivalPanelDetails(page: Page): Promise<void> {
  await expect(page.getByTestId('rival-area')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId('rival-panel')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId('rival-progress')).toBeVisible({
    timeout: 10_000,
  });
  await expectNumericReadout(page, 'rival-progress-total');
  await expect(page.getByTestId('rival-progress-cycle')).toHaveAttribute(
    'data-layout',
    'radial-cycle',
  );
  await expect(
    page.locator('[data-testid^="rival-progress-slot-"]'),
  ).toHaveCount(12);
  await expect(
    page.locator('[data-testid^="rival-progress-slot-"][data-current="true"]'),
  ).toHaveCount(1);

  await expectNumericReadout(page, 'rival-deck-draw');
  await expectNumericReadout(page, 'rival-deck-discard');
  await expect(page.getByTestId('rival-current-card')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId('rival-tech-pile')).toBeVisible({
    timeout: 10_000,
  });
  for (const tech of ['probe', 'scan', 'computer']) {
    await expectNumericReadout(page, `rival-tech-count-${tech}`);
  }

  await expect(page.getByTestId('rival-objectives')).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.locator('[data-testid^="rival-objective-SOLO."]'),
  ).toHaveCount(3, { timeout: 10_000 });
  await expect(page.getByTestId('rival-completed-objectives')).toBeVisible();
  await expect(page.getByTestId('rival-computer')).toBeVisible();
  await expect(page.getByTestId('rival-computer').locator('> *')).toHaveCount(
    6,
  );
}

async function expectRivalRulesDialog(page: Page): Promise<void> {
  await page.getByTestId('rival-rules-button').click();
  await expect(page.getByTestId('rival-rules-dialog')).toBeVisible({
    timeout: 10_000,
  });
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('rival-rules-dialog')).toBeHidden({
    timeout: 10_000,
  });
}

async function passAndWaitForRivalSync(
  actorPage: Page,
  observerPage: Page,
): Promise<string> {
  await openEventLog(actorPage);
  await openEventLog(observerPage);

  const actorEventCountBefore = await eventEntryCount(actorPage);
  const observerEventCountBefore = await eventEntryCount(observerPage);

  await clickMainAction(actorPage, 'PASS');

  await expect
    .poll(
      async () => {
        await waitForAndResolveCardPrompt(actorPage, 750);

        const pass = actorPage.locator(sel.actionMenu('PASS'));
        const passReady =
          (await pass.isVisible().catch(() => false)) &&
          (await pass.isEnabled().catch(() => false));
        const actorEventCount = await eventEntryCount(actorPage);

        return passReady && actorEventCount > actorEventCountBefore
          ? 'updated'
          : '';
      },
      { timeout: 45_000 },
    )
    .not.toBe('');

  const actorSnapshotAfter = await getRivalPanelSnapshot(actorPage);
  await expect
    .poll(
      async () => {
        const observerSnapshot = await getRivalPanelSnapshot(observerPage);
        const observerEventCount = await eventEntryCount(observerPage);
        return observerSnapshot === actorSnapshotAfter &&
          observerEventCount > observerEventCountBefore
          ? 'synced'
          : 'waiting';
      },
      { timeout: 20_000 },
    )
    .toBe('synced');

  await expect(
    actorPage
      .getByTestId('rival-current-card')
      .locator('[data-testid^="rival-action-card-render-S."]')
      .first(),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    observerPage
      .getByTestId('rival-current-card')
      .locator('[data-testid^="rival-action-card-render-S."]')
      .first(),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    actorPage.locator('[data-testid^="rival-card-hover-S."]').first(),
  ).toBeAttached({ timeout: 10_000 });

  return actorSnapshotAfter;
}

async function expectSoloAlienSmokeSurface(page: Page): Promise<void> {
  await openTab(page, 'Aliens');
  for (const alienIndex of [0, 1]) {
    await expect(page.getByTestId(`alien-${alienIndex}-card`)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByTestId(`alien-${alienIndex}-discovery-zone`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`alien-${alienIndex}-overflow-zone`),
    ).toBeVisible();
    for (const color of ['red-trace', 'yellow-trace', 'blue-trace']) {
      await expect(
        page.getByTestId(`alien-${alienIndex}-discovery-column-${color}`),
      ).toBeVisible();
      await expect(
        page.getByTestId(`alien-${alienIndex}-discovery-column-${color}-slots`),
      ).toBeVisible();
      await expect(
        page.getByTestId(`alien-${alienIndex}-overflow-column-${color}`),
      ).toBeVisible();
      await expect(
        page.getByTestId(`alien-${alienIndex}-overflow-column-${color}-slots`),
      ).toBeVisible();
    }
  }
}

test.describe('Solo @smoke @real-ui', () => {
  test('creates a solo rival game, renders the full UI shell, and syncs rival turn state across real sessions', async ({
    browser,
    request,
  }) => {
    test.setTimeout(240_000);
    await waitForServerReady(request);

    const hostContext = await browser.newContext();
    const observerContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const observerPage = await observerContext.newPage();
    const host = createUser('solo-smoke-host');

    try {
      await registerByUi(hostPage, host);

      const roomId = await createRoomByUi(
        hostPage,
        `Solo Smoke Room ${Date.now()}`,
        2,
        { isSoloMode: true, soloDifficulty: 3 },
      );

      await expect(
        hostPage.getByTestId('game-setting-value-players'),
      ).toHaveText('1');
      await expect(
        hostPage.getByTestId('game-setting-value-solo-difficulty'),
      ).toContainText('3');

      const gameId = await launchGameByUi(hostPage, roomId);

      await loginByUi(observerPage, host);
      const observerGameId = await enterGameByUi(observerPage, roomId);
      expect(observerGameId).toBe(gameId);

      await expectGameShell(hostPage);
      await expectRivalPanelDetails(hostPage);
      await expectRivalPanelDetails(observerPage);
      await expectSoloAlienSmokeSurface(hostPage);
      await expectRivalRulesDialog(hostPage);

      const hostSnapshotAfter = await passAndWaitForRivalSync(
        hostPage,
        observerPage,
      );
      const observerSnapshotAfter = await getRivalPanelSnapshot(observerPage);
      expect(observerSnapshotAfter).toBe(hostSnapshotAfter);
    } finally {
      await hostContext.close().catch(() => undefined);
      await observerContext.close().catch(() => undefined);
    }
  });
});
