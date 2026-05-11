import { expect, type Page, test } from '@playwright/test';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import type { IPublicRivalState } from '@seti/common/types/protocol/solo';
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
type TRenderMode = 'image' | 'text';
type TSocketPayload = string | { toString(): string };

interface IRivalStateCollector {
  latestRivalGameState(): IPublicGameState | null;
  rivalStateCount(): number;
  waitForRivalGameState(): Promise<IPublicGameState>;
  waitForNextRivalGameState(previousCount: number): Promise<IPublicGameState>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function createGameStateCollector(page: Page): IRivalStateCollector {
  const states: IPublicGameState[] = [];

  page.on('websocket', (socket) => {
    socket.on('framereceived', (event) => {
      const state = parseGameStateFrame(event.payload as TSocketPayload);
      if (state?.rival) {
        states.push(state);
      }
    });
  });

  return {
    latestRivalGameState: () => states.at(-1) ?? null,
    rivalStateCount: () => states.length,
    async waitForRivalGameState() {
      await expect
        .poll(() => states.length, { timeout: 15_000 })
        .toBeGreaterThan(0);
      return states.at(-1) ?? failRivalState('missing latest rival state');
    },
    async waitForNextRivalGameState(previousCount: number) {
      await expect
        .poll(() => states.length, { timeout: 20_000 })
        .toBeGreaterThan(previousCount);
      return states.at(-1) ?? failRivalState('missing next rival state');
    },
  };
}

function parseGameStateFrame(payload: TSocketPayload): IPublicGameState | null {
  const text = typeof payload === 'string' ? payload : payload.toString();
  const payloadStart = text.indexOf('[');
  if (payloadStart < 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(text.slice(payloadStart));
    if (
      !Array.isArray(parsed) ||
      parsed[0] !== 'game:state' ||
      !isRecord(parsed[1]) ||
      !isRecord(parsed[1].gameState)
    ) {
      return null;
    }
    return parsed[1].gameState as unknown as IPublicGameState;
  } catch {
    return null;
  }
}

function failRivalState(message: string): never {
  throw new Error(message);
}

function requireRivalState(gameState: IPublicGameState): IPublicRivalState {
  return gameState.rival ?? failRivalState('expected solo rival projection');
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function parseRivalActionCardId(testId: string | null): string {
  const match = testId?.match(/^rival-action-card-render-(S\.\d+)$/);
  if (!match) {
    throw new Error(
      `Expected rival action card test id, got ${testId ?? 'null'}`,
    );
  }
  return match[1];
}

function parseRivalEventCardId(testId: string | null): string {
  const match = testId?.match(/^rival-card-hover-(S\.\d+)$/);
  if (!match) {
    throw new Error(
      `Expected rival event card test id, got ${testId ?? 'null'}`,
    );
  }
  return match[1];
}

function parseRivalObjectiveId(testId: string | null): string {
  const match = testId?.match(/^rival-objective-(SOLO\.\d+)$/);
  if (!match) {
    throw new Error(
      `Expected rival objective test id, got ${testId ?? 'null'}`,
    );
  }
  return match[1];
}

async function getRivalCurrentActionCardId(page: Page): Promise<string | null> {
  const renderedCurrentCard = page
    .getByTestId('rival-current-card')
    .locator('[data-testid^="rival-action-card-render-S."]')
    .first();
  if ((await renderedCurrentCard.count()) === 0) {
    return null;
  }
  const testId = await renderedCurrentCard
    .getAttribute('data-testid', { timeout: 1_000 })
    .catch(() => null);
  return testId ? parseRivalActionCardId(testId) : null;
}

async function getRivalPanelSnapshot(page: Page): Promise<string> {
  const activeProgressSlot = page
    .locator('[data-testid^="rival-progress-slot-"][data-current="true"]')
    .first();
  const currentCardId = await getRivalCurrentActionCardId(page);

  const [progress, draw, discard, activeSlotId] = await Promise.all([
    page.getByTestId('rival-progress-total').textContent({ timeout: 1_000 }),
    page.getByTestId('rival-deck-draw').textContent({ timeout: 1_000 }),
    page.getByTestId('rival-deck-discard').textContent({ timeout: 1_000 }),
    activeProgressSlot
      .getAttribute('data-testid', { timeout: 1_000 })
      .catch(() => 'none'),
  ]);

  return [progress, draw, discard, activeSlotId, currentCardId ?? 'none']
    .map((value) => normalizeText(value ?? ''))
    .join('|');
}

async function enableTextModeByUi(page: Page): Promise<void> {
  await page.goto('/');
  const toggle = page.locator('#home-text-mode');
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  if ((await toggle.getAttribute('aria-checked')) !== 'true') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-checked', 'true', {
    timeout: 10_000,
  });
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

async function expectRivalPanelDetails(
  page: Page,
  mode: TRenderMode,
): Promise<void> {
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
  if (mode === 'image') {
    await expect(page.getByTestId('rival-board-image-mode')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('rival-board-image-mode')).toHaveAttribute(
      'data-reference-layout',
      'automa-board',
    );
    await expect(page.getByTestId('rival-board-image')).toHaveAttribute(
      'src',
      /\/assets\/seti\/solo\/boards\/rival-board-\d\.jpg$/,
    );
    await expect(
      page.getByTestId('rival-board-progress-marker'),
    ).toHaveAttribute('data-slot', /\d+/);
    await expect(page.getByTestId('rival-board-data-pool')).toHaveAttribute(
      'data-count',
      /\d+/,
    );
    await expect(
      page.locator(
        '[data-testid^="rival-progress-slot-"][data-current="true"]',
      ),
    ).toHaveCount(1);
    await expect(
      page.locator('[data-testid^="rival-progress-slot-"]').first(),
    ).toHaveAttribute('data-fill-mode', 'background');
  } else {
    await expect(page.getByTestId('rival-progress-cycle')).toHaveAttribute(
      'data-layout',
      'radial-cycle',
    );
    await expect(page.getByTestId('rival-progress-cycle')).toHaveAttribute(
      'data-mode',
      mode,
    );
    await expect(
      page.locator('[data-testid^="rival-progress-slot-"]'),
    ).toHaveCount(12);
    await expect(
      page.locator(
        '[data-testid^="rival-progress-slot-"][data-current="true"]',
      ),
    ).toHaveCount(1);
    await expect(
      page.locator('[data-testid^="rival-progress-slot-"]').first(),
    ).toHaveAttribute('data-fill-mode', 'border');
    await expect(page.getByTestId('rival-board-image-mode')).toHaveCount(0);
    await expect(page.getByTestId('rival-computer-data-pool')).toHaveAttribute(
      'data-count',
      /\d+/,
    );
  }

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
  await expect(page.getByTestId('rival-computer-slot-0')).toHaveAttribute(
    'data-filled',
    /true|false/,
  );
}

async function getRivalObjectiveIds(page: Page): Promise<string[]> {
  const objectives = page.locator('[data-testid^="rival-objective-SOLO."]');
  await expect(objectives).toHaveCount(3, { timeout: 10_000 });
  const ids: string[] = [];
  for (let index = 0; index < 3; index += 1) {
    ids.push(
      parseRivalObjectiveId(
        await objectives.nth(index).getAttribute('data-testid'),
      ),
    );
  }
  return ids;
}

async function getActiveRivalProgressSlot(page: Page): Promise<number> {
  const activeProgressSlot = page
    .locator('[data-testid^="rival-progress-slot-"][data-current="true"]')
    .first();
  const testId = await activeProgressSlot.getAttribute('data-testid', {
    timeout: 10_000,
  });
  const match = testId?.match(/^rival-progress-slot-(\d+)$/);
  if (!match) {
    throw new Error(`Expected active progress slot test id, got ${testId}`);
  }
  return Number(match[1]);
}

async function getRivalCompletedObjectiveIds(page: Page): Promise<string[]> {
  const text = await page
    .getByTestId('rival-completed-objectives')
    .textContent({ timeout: 10_000 });
  return Array.from((text ?? '').matchAll(/SOLO\.\d+/g), (match) => match[0]);
}

function countTechsByCategory(
  techIds: readonly string[],
): Record<'probe' | 'scan' | 'computer', number> {
  const counts = {
    probe: 0,
    scan: 0,
    computer: 0,
  };

  for (const techId of techIds) {
    if (techId.startsWith('probe-')) {
      counts.probe += 1;
    } else if (techId.startsWith('scan-')) {
      counts.scan += 1;
    } else if (techId.startsWith('comp-')) {
      counts.computer += 1;
    }
  }

  return counts;
}

function rivalComparableProjection(gameState: IPublicGameState): {
  rival: IPublicRivalState;
} {
  const rival = requireRivalState(gameState);

  return {
    rival,
  };
}

function expectRivalServerProjectionSame(
  left: IPublicGameState,
  right: IPublicGameState,
): void {
  expect(rivalComparableProjection(left)).toEqual(
    rivalComparableProjection(right),
  );
}

async function expectRivalUiMatchesServerProjection(
  page: Page,
  mode: TRenderMode,
  gameState: IPublicGameState,
): Promise<void> {
  const rival = requireRivalState(gameState);

  await expect(page.getByTestId('rival-progress-total')).toHaveText(
    String(rival.progress),
    { timeout: 10_000 },
  );
  expect(await getActiveRivalProgressSlot(page)).toBe(rival.progressSlot);

  if (mode === 'image') {
    await expect(page.getByTestId('rival-board-image-mode')).toHaveAttribute(
      'data-board-config-id',
      rival.boardConfigId,
      { timeout: 10_000 },
    );
    await expect(page.getByTestId('rival-board-image')).toHaveAttribute(
      'src',
      new RegExp(`/assets/seti/solo/boards/${rival.boardConfigId}\\.jpg$`),
    );
    await expect(page.getByTestId('rival-board-data-pool')).toHaveAttribute(
      'data-count',
      String(rival.computer.dataPool),
    );
    await expect(page.getByTestId('rival-computer-data-pool')).toHaveCount(0);
  } else {
    await expect(page.getByTestId('rival-board-image-mode')).toHaveCount(0);
    await expect(page.getByTestId('rival-computer-data-pool')).toHaveAttribute(
      'data-count',
      String(rival.computer.dataPool),
    );
    await expect(page.getByTestId('rival-board-data-pool')).toHaveCount(0);
  }

  await expect(page.getByTestId('rival-deck-draw')).toHaveText(
    String(rival.actionDeck.drawPileSize),
  );
  await expect(page.getByTestId('rival-deck-discard')).toHaveText(
    String(rival.actionDeck.discardPileSize),
  );
  expect(await getRivalCurrentActionCardId(page)).toBe(
    rival.actionDeck.currentCardId,
  );
  expect(await getRivalObjectiveIds(page)).toEqual(rival.revealedObjectiveIds);
  expect(await getRivalCompletedObjectiveIds(page)).toEqual(
    rival.completedObjectiveIds,
  );

  for (const [index, filled] of rival.computer.filledSlots.entries()) {
    await expect(
      page.getByTestId(`rival-computer-slot-${index}`),
    ).toHaveAttribute('data-filled', filled ? 'true' : 'false');
  }

  for (const objectiveId of rival.revealedObjectiveIds) {
    const markedCount = rival.objectiveTaskMarkers[objectiveId]?.length ?? 0;
    await expect(
      page.getByTestId(`rival-objective-${objectiveId}`),
    ).toContainText(new RegExp(`${markedCount}/`));
  }

  const techCounts = countTechsByCategory(rival.techIds);
  await expect(page.getByTestId('rival-tech-count-probe')).toHaveText(
    String(techCounts.probe),
  );
  await expect(page.getByTestId('rival-tech-count-scan')).toHaveText(
    String(techCounts.scan),
  );
  await expect(page.getByTestId('rival-tech-count-computer')).toHaveText(
    String(techCounts.computer),
  );
}

async function expectRivalObjectiveRenderConsistency(
  page: Page,
  mode: TRenderMode,
): Promise<string[]> {
  const objectiveIds = await getRivalObjectiveIds(page);

  for (const objectiveId of objectiveIds) {
    const objective = page.getByTestId(`rival-objective-${objectiveId}`);
    await expect(objective).toBeVisible({ timeout: 10_000 });

    if (mode === 'image') {
      const image = page.getByTestId(`rival-objective-image-${objectiveId}`);
      await expect(image).toBeVisible({ timeout: 10_000 });
      await expect(image).toHaveAttribute(
        'src',
        new RegExp(`/assets/seti/solo/objective-cards/${objectiveId}\\.png$`),
      );
      await expect(image).toHaveAttribute('alt', new RegExp(objectiveId));
      await expect(
        objective.getByTestId(`rival-objective-text-card-${objectiveId}`),
      ).toHaveCount(0);
      continue;
    }

    const textCard = objective.getByTestId(
      `rival-objective-text-card-${objectiveId}`,
    );
    await expect(textCard).toBeVisible({ timeout: 10_000 });
    await expect(textCard).toContainText(objectiveId);
    await expect(
      objective.getByTestId(`rival-objective-image-${objectiveId}`),
    ).toHaveCount(0);
  }

  return objectiveIds;
}

async function getLatestRivalEventCardId(page: Page): Promise<string> {
  await openEventLog(page);
  const eventCards = page.locator('[data-testid^="rival-card-hover-S."]');
  await expect
    .poll(() => eventCards.count(), { timeout: 10_000 })
    .toBeGreaterThan(0);

  const count = await eventCards.count();
  return parseRivalEventCardId(
    await eventCards.nth(count - 1).getAttribute('data-testid'),
  );
}

async function expectRivalEventCardRenderConsistency(
  page: Page,
  mode: TRenderMode,
  expectedCardId?: string,
): Promise<string> {
  const cardId = await getLatestRivalEventCardId(page);
  if (expectedCardId) {
    expect(cardId).toBe(expectedCardId);
  }

  const eventCard = page
    .locator(`[data-testid="rival-card-hover-${cardId}"]`)
    .last();
  const renderedCard = eventCard.getByTestId(
    `rival-action-card-render-${cardId}`,
  );
  await expect(renderedCard).toBeAttached({ timeout: 10_000 });

  if (mode === 'image') {
    const image = renderedCard.getByTestId(`rival-action-card-image-${cardId}`);
    await expect(image).toBeAttached({ timeout: 10_000 });
    await expect(image).toHaveAttribute(
      'src',
      new RegExp(`/assets/seti/solo/action-cards/${cardId}\\.jpg$`),
    );
    await expect(image).toHaveAttribute('alt', new RegExp(cardId));
    await expect(
      renderedCard.getByTestId(`rival-action-card-text-${cardId}`),
    ).toHaveCount(0);
    return cardId;
  }

  const textCard = renderedCard.getByTestId(`rival-action-card-text-${cardId}`);
  await expect(textCard).toBeAttached({ timeout: 10_000 });
  await expect(textCard).toContainText(cardId);
  await expect(
    renderedCard.getByTestId(`rival-action-card-image-${cardId}`),
  ).toHaveCount(0);
  return cardId;
}

async function expectPlayerAndRivalAreas(page: Page): Promise<void> {
  await expect(page.getByTestId('bottom-dashboard')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId('mission-area')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId('played-missions')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId('rival-area')).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.locator('[data-testid="rival-area"] [data-testid="mission-area"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-testid="rival-area"] [data-testid="played-missions"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-testid="rival-area"] [data-testid="resource-bar"]'),
  ).toHaveCount(0);
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

  const actorSnapshotBefore = await getRivalPanelSnapshot(actorPage);
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
        const actorSnapshot = await getRivalPanelSnapshot(actorPage);

        return passReady &&
          (actorEventCount > actorEventCountBefore ||
            actorSnapshot !== actorSnapshotBefore)
          ? 'updated'
          : '';
      },
      { timeout: 60_000 },
    )
    .not.toBe('');

  const actorSnapshotAfter = await getRivalPanelSnapshot(actorPage);
  expect(actorSnapshotAfter).not.toBe(actorSnapshotBefore);
  await expect
    .poll(() => eventEntryCount(actorPage), { timeout: 10_000 })
    .toBeGreaterThan(actorEventCountBefore);
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
  await expect
    .poll(() => eventEntryCount(observerPage), { timeout: 10_000 })
    .toBeGreaterThan(observerEventCountBefore);

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
  test('creates a solo rival game, verifies image/text render modes, and syncs rival turn state across real sessions', async ({
    browser,
    request,
  }) => {
    test.setTimeout(240_000);
    await waitForServerReady(request);

    const hostContext = await browser.newContext();
    const observerContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const observerPage = await observerContext.newPage();
    const hostStateCollector = createGameStateCollector(hostPage);
    const observerStateCollector = createGameStateCollector(observerPage);
    const host = createUser('solo-smoke-host');

    try {
      await enableTextModeByUi(observerPage);
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
        hostPage.getByTestId('game-setting-value-mode'),
      ).toContainText(/solo/i);
      await expect(
        hostPage.getByTestId('game-setting-value-solo-difficulty'),
      ).toContainText('3');

      const gameId = await launchGameByUi(hostPage, roomId);

      await loginByUi(observerPage, host);
      const observerGameId = await enterGameByUi(observerPage, roomId);
      expect(observerGameId).toBe(gameId);

      await expectGameShell(hostPage);
      await expectPlayerAndRivalAreas(hostPage);
      await expectPlayerAndRivalAreas(observerPage);
      await expectRivalPanelDetails(hostPage, 'image');
      await expectRivalPanelDetails(observerPage, 'text');
      const hostServerState = await hostStateCollector.waitForRivalGameState();
      const observerServerState =
        await observerStateCollector.waitForRivalGameState();
      expectRivalServerProjectionSame(hostServerState, observerServerState);
      await expectRivalUiMatchesServerProjection(
        hostPage,
        'image',
        hostServerState,
      );
      await expectRivalUiMatchesServerProjection(
        observerPage,
        'text',
        observerServerState,
      );
      const hostObjectiveIds = await expectRivalObjectiveRenderConsistency(
        hostPage,
        'image',
      );
      const observerObjectiveIds = await expectRivalObjectiveRenderConsistency(
        observerPage,
        'text',
      );
      expect(observerObjectiveIds).toEqual(hostObjectiveIds);
      await expectSoloAlienSmokeSurface(hostPage);
      await expectRivalRulesDialog(hostPage);
      await expectRivalRulesDialog(observerPage);

      const hostStateCountBeforePass = hostStateCollector.rivalStateCount();
      const observerStateCountBeforePass =
        observerStateCollector.rivalStateCount();
      const hostSnapshotAfter = await passAndWaitForRivalSync(
        hostPage,
        observerPage,
      );
      const hostServerStateAfter =
        await hostStateCollector.waitForNextRivalGameState(
          hostStateCountBeforePass,
        );
      const observerServerStateAfter =
        await observerStateCollector.waitForNextRivalGameState(
          observerStateCountBeforePass,
        );
      expectRivalServerProjectionSame(
        hostServerStateAfter,
        observerServerStateAfter,
      );
      await expectRivalUiMatchesServerProjection(
        hostPage,
        'image',
        hostServerStateAfter,
      );
      await expectRivalUiMatchesServerProjection(
        observerPage,
        'text',
        observerServerStateAfter,
      );
      const observerSnapshotAfter = await getRivalPanelSnapshot(observerPage);
      expect(observerSnapshotAfter).toBe(hostSnapshotAfter);
      const eventCardId = await expectRivalEventCardRenderConsistency(
        hostPage,
        'image',
      );
      await expectRivalEventCardRenderConsistency(
        observerPage,
        'text',
        eventCardId,
      );
    } finally {
      await hostContext.close().catch(() => undefined);
      await observerContext.close().catch(() => undefined);
    }
  });
});
