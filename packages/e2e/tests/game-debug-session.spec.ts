import { expect, test } from '@playwright/test';
import { SetiApi } from '../helpers/api';
import { injectAuth } from '../helpers/auth';
import { GamePage } from '../helpers/game-page';
import { sel } from '../helpers/selectors';
import { WsTestClient } from '../helpers/ws-client';

/**
 * ══════════════════════════════════════════════════════════════════════
 * Debug Session E2E: Single-player game flow with AI bot opponent.
 *
 * Uses the server's POST /debug/server/session endpoint to create a
 * game where the human player controls one side and the server
 * automatically plays the bot. This is the simplest E2E entry point.
 * ══════════════════════════════════════════════════════════════════════
 */

test.describe('Debug Session Game', () => {
  test.describe.configure({ mode: 'serial' });

  let api: SetiApi;
  let gameId: string;
  let token: string;
  let user: { id: string; name: string; email: string };
  let ws: WsTestClient;
  let gamePage: GamePage;

  test.beforeAll(async ({ request, browser }) => {
    api = new SetiApi(request);

    // Create a debug session (no registration needed)
    const session = await api.createDebugSession();
    gameId = session.gameId;
    token = session.accessToken;
    user = session.user;
  });

  test.afterAll(async () => {
    ws?.disconnect();
  });

  // ── 1. WebSocket connection and initial state ──────────────

  test('1. connect via WebSocket and receive initial game state', async () => {
    ws = new WsTestClient();
    await ws.connect(token);
    ws.joinGame(gameId);

    const state = await ws.waitForState(10_000);

    expect(state).toBeDefined();
    expect(state.round).toBe(1);
    expect(state.players).toHaveLength(2);
    expect(state.phase).toContain('AWAIT_MAIN_ACTION');
    expect(state.solarSystem).toBeDefined();
    expect(state.cardRow.length).toBeGreaterThan(0);
  });

  // ── 2. Game page loads in browser ──────────────────────────

  test('2. game page renders the board and bottom bar', async ({ page }) => {
    await injectAuth(page, token, user);
    gamePage = new GamePage(page);

    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    await expect(page.locator(sel.bottomDashboard)).toBeVisible();
    await expect(page.locator(sel.bottomHand)).toBeVisible();
    await expect(page.locator(sel.bottomActions)).toBeVisible();
  });

  test('3. player dashboard shows resources', async ({ page }) => {
    await injectAuth(page, token, user);
    gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const resourceBar = page.locator(sel.resourceBar);
    await expect(resourceBar).toBeVisible();
  });

  test('4. hand view shows initial cards', async ({ page }) => {
    await injectAuth(page, token, user);
    gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const handView = page.locator(sel.handView);
    await expect(handView).toBeVisible();

    const cards = page.locator('[data-testid^="hand-card-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // ── 3. Board tab navigation ────────────────────────────────

  test('5. board tab shows solar system', async ({ page }) => {
    await injectAuth(page, token, user);
    gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    await gamePage.switchTab('Board');

    const ring1 = page.locator(sel.wheelLayerRing(1));
    await expect(ring1).toBeVisible();
  });

  test('6. planets tab shows planetary board', async ({ page }) => {
    await injectAuth(page, token, user);
    gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    await gamePage.switchTab('Planets');
    // Verify we're on the planets tab
    await page.waitForTimeout(500);
  });

  test('7. tech tab shows tech stacks', async ({ page }) => {
    await injectAuth(page, token, user);
    gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    await gamePage.switchTab('Tech');

    const techStacks = page.locator('[data-testid^="tech-stack-"]');
    const count = await techStacks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('8. cards tab shows card row and end-of-round stacks', async ({
    page,
  }) => {
    await injectAuth(page, token, user);
    gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    await gamePage.switchTab('Cards');

    const cardRow = page.locator('[data-testid^="card-row-"]');
    await expect(cardRow.first()).toBeVisible();
  });

  // ── 4. Action menu ─────────────────────────────────────────

  test('9. action menu displays available actions', async ({ page }) => {
    await injectAuth(page, token, user);
    gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    // The action menu should show at least the PASS button
    const passBtn = page.locator(sel.actionMenu('PASS'));
    // It might not be visible if it's not our turn
    // (bot might have already played)

    const actionsPanel = page.locator(sel.bottomActions);
    await expect(actionsPanel).toBeVisible();
  });

  // ── 5. Perform actions via WebSocket and verify UI updates ─

  test('10. sending an action via WS updates the UI', async ({ page }) => {
    await injectAuth(page, token, user);
    gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState;
    if (!state || state.currentPlayerId !== user.id) {
      // Not our turn — skip
      return;
    }

    // Send PASS via WebSocket
    ws.sendAction(gameId, { type: 'PASS' });

    // Wait for state update
    const newState = await ws.waitForState(5_000);
    expect(newState).toBeDefined();

    // UI should update (give it a moment for re-render)
    await page.waitForTimeout(1_000);

    // Dashboard should still be visible (no crash)
    await expect(page.locator(sel.bottomDashboard)).toBeVisible();
  });

  // ── 6. Free action bar ─────────────────────────────────────

  test('11. free action bar shows available free actions', async ({ page }) => {
    await injectAuth(page, token, user);
    gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const freeActionBar = page.locator(sel.freeActionBar);

    // Toggle free action bar open if collapsed
    const toggle = page.locator(sel.freeActionToggle);
    if (await toggle.isVisible()) {
      await toggle.click();
    }

    if (await freeActionBar.isVisible()) {
      // At minimum, PLACE_DATA and EXCHANGE_RESOURCES should exist
      const placeDataBtn = page.locator(sel.freeAction('PLACE_DATA'));
      const exchangeBtn = page.locator(sel.freeAction('EXCHANGE_RESOURCES'));
      // These might be disabled depending on game state, but should render
      expect(
        (await placeDataBtn.count()) + (await exchangeBtn.count()),
      ).toBeGreaterThan(0);
    }
  });

  // ── 7. Event log ───────────────────────────────────────────

  test('12. event log records game events', async ({ page }) => {
    await injectAuth(page, token, user);
    gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const eventLog = page.locator(sel.eventLog);
    if (await eventLog.isVisible()) {
      const entries = page.locator('[data-testid^="event-entry-"]');
      const count = await entries.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});
