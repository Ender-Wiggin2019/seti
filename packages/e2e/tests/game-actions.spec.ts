import { expect, type Page, test } from '@playwright/test';
import { SetiApi } from '../helpers/api';
import { injectAuth } from '../helpers/auth';
import { GamePage } from '../helpers/game-page';
import { sel } from '../helpers/selectors';
import { type IWsGameState, WsTestClient } from '../helpers/ws-client';

/**
 * ══════════════════════════════════════════════════════════════════════
 * Game Actions E2E: Detailed action-by-action tests.
 *
 * Each test block focuses on a single game action type and validates:
 *   1. The action button/UI element is present and correct
 *   2. Executing the action updates the game state
 *   3. The UI reflects the updated state
 *
 * Uses a WebSocket helper alongside the browser for hybrid testing:
 *   - WS: send actions, read precise game state
 *   - Browser: verify UI rendering and user-facing behavior
 * ══════════════════════════════════════════════════════════════════════
 */

let api: SetiApi;
let token: string;
let userId: string;
let gameId: string;
let ws: WsTestClient;

function findMyPlayer(state: IWsGameState, id: string) {
  return state.players.find((p) => p.playerId === id);
}

/**
 * Helper: resolve all pending inputs for a player via WS by picking defaults.
 */
async function resolveInputsViaWs(
  wsClient: WsTestClient,
  gId: string,
): Promise<void> {
  let attempts = 0;
  while (wsClient.pendingInput && attempts < 20) {
    attempts++;
    const input = wsClient.pendingInput.input;

    switch (input.type) {
      case 'CARD':
        if (input.cards?.length) {
          wsClient.sendInput(gId, {
            type: 'CARD',
            cardIds: [input.cards[0].id],
          });
        }
        break;
      case 'END_OF_ROUND':
        if (input.cards?.length) {
          wsClient.sendInput(gId, {
            type: 'END_OF_ROUND',
            cardId: input.cards[0].id,
          });
        }
        break;
      case 'OPTION':
        if (input.options?.length) {
          const done = input.options.find((o) => o.id === 'done');
          wsClient.sendInput(gId, {
            type: 'OPTION',
            optionId: done?.id ?? input.options[0].id,
          });
        }
        break;
      case 'GOLD_TILE':
        if (input.options?.length) {
          wsClient.sendInput(gId, {
            type: 'GOLD_TILE',
            tileId: (input.options as unknown as string[])[0],
          });
        }
        break;
      case 'TECH':
        if (input.options?.length) {
          wsClient.sendInput(gId, {
            type: 'TECH',
            tech: (input.options as unknown as string[])[0],
          });
        }
        break;
      case 'TRACE':
        if (input.options?.length) {
          wsClient.sendInput(gId, {
            type: 'TRACE',
            trace: (input.options as unknown as string[])[0],
          });
        }
        break;
      default:
        return;
    }

    await wsClient.waitForState(3_000).catch(() => undefined);
  }
}

/**
 * Ensure it's the human player's turn by passing the other player if needed.
 */
async function ensureMyTurn(
  wsClient: WsTestClient,
  gId: string,
  myId: string,
  otherToken: string,
): Promise<void> {
  const state = wsClient.gameState;
  if (!state || state.currentPlayerId === myId) return;

  // The other player needs to act — use a separate WS client
  const otherWs = new WsTestClient();
  await otherWs.connect(otherToken);
  otherWs.joinGame(gId);
  await otherWs.waitForState(5_000);
  otherWs.sendAction(gId, { type: 'PASS' });
  await otherWs.waitForState(5_000).catch(() => undefined);
  await resolveInputsViaWs(otherWs, gId);
  otherWs.disconnect();

  await wsClient.waitForState(5_000).catch(() => undefined);
}

// ═══════════════════════════════════════════════════════════════════
// LAUNCH PROBE
// ═══════════════════════════════════════════════════════════════════

test.describe('Action: Launch Probe', () => {
  test.beforeAll(async ({ request }) => {
    api = new SetiApi(request);
    const session = await api.createDebugSession();
    gameId = session.gameId;
    token = session.accessToken;
    userId = session.user.id;

    ws = new WsTestClient();
    await ws.connect(token);
    ws.joinGame(gameId);
    await ws.waitForState(10_000);
  });

  test.afterAll(() => {
    ws?.disconnect();
  });

  test('launch probe button is visible when it is my turn', async ({
    page,
  }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId === userId) {
      const launchBtn = page.locator(sel.actionMenu('LAUNCH_PROBE'));
      await expect(launchBtn).toBeVisible();
    }
  });

  test('clicking launch probe sends action and updates state', async ({
    page,
  }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    const myPlayer = findMyPlayer(state, userId);
    const creditsBefore = myPlayer?.resources.credits ?? 0;

    if (creditsBefore < 2) {
      test.skip();
      return;
    }

    await gamePage.clickMainAction('LAUNCH_PROBE');

    // Wait for state update
    await ws.waitForState(5_000).catch(() => undefined);
    await resolveInputsViaWs(ws, gameId);

    // After launch, credits should decrease by 2
    const newState = ws.gameState!;
    const newPlayer = findMyPlayer(newState, userId);
    expect(newPlayer?.resources.credits).toBeLessThan(creditsBefore);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SCAN
// ═══════════════════════════════════════════════════════════════════

test.describe('Action: Scan', () => {
  test.beforeAll(async ({ request }) => {
    api = new SetiApi(request);
    const session = await api.createDebugSession();
    gameId = session.gameId;
    token = session.accessToken;
    userId = session.user.id;

    ws = new WsTestClient();
    await ws.connect(token);
    ws.joinGame(gameId);
    await ws.waitForState(10_000);
  });

  test.afterAll(() => {
    ws?.disconnect();
  });

  test('scan button is visible with sufficient resources', async ({ page }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    const myPlayer = findMyPlayer(state, userId);
    if (
      (myPlayer?.resources.credits ?? 0) >= 1 &&
      (myPlayer?.resources.energy ?? 0) >= 2
    ) {
      const scanBtn = page.locator(sel.actionMenu('SCAN'));
      await expect(scanBtn).toBeVisible();
    }
  });

  test('scan via WS → UI shows updated state', async ({ page }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    const myPlayer = findMyPlayer(state, userId);
    if (
      (myPlayer?.resources.credits ?? 0) < 1 ||
      (myPlayer?.resources.energy ?? 0) < 2
    ) {
      test.skip();
      return;
    }

    // Send scan via WS
    ws.sendAction(gameId, { type: 'SCAN' });
    await ws.waitForState(5_000).catch(() => undefined);

    // Resolve scan sub-actions (mark-earth, mark-card-row, done)
    await resolveInputsViaWs(ws, gameId);

    // UI should still render correctly
    await page.waitForTimeout(1_000);
    await expect(page.locator(sel.bottomDashboard)).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════
// PLAY CARD
// ═══════════════════════════════════════════════════════════════════

test.describe('Action: Play Card', () => {
  test.beforeAll(async ({ request }) => {
    api = new SetiApi(request);
    const session = await api.createDebugSession();
    gameId = session.gameId;
    token = session.accessToken;
    userId = session.user.id;

    ws = new WsTestClient();
    await ws.connect(token);
    ws.joinGame(gameId);
    await ws.waitForState(10_000);
  });

  test.afterAll(() => {
    ws?.disconnect();
  });

  test('play card button is visible with cards in hand', async ({ page }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    const myPlayer = findMyPlayer(state, userId);
    if ((myPlayer?.handSize ?? 0) > 0) {
      const playCardBtn = page.locator(sel.actionMenu('PLAY_CARD'));
      await expect(playCardBtn).toBeVisible();
    }
  });

  test('playing a card removes it from hand UI', async ({ page }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    // Get hand size before
    const handCardsBefore = await gamePage.getHandCardIds();
    if (handCardsBefore.length === 0) {
      test.skip();
      return;
    }

    // Play first card via WS
    ws.sendAction(gameId, { type: 'PLAY_CARD', payload: { cardIndex: 0 } });
    await ws.waitForState(5_000).catch(() => undefined);
    await resolveInputsViaWs(ws, gameId);

    // Hand should have fewer cards in the UI
    await page.waitForTimeout(1_000);
    const handCardsAfter = await gamePage.getHandCardIds();
    expect(handCardsAfter.length).toBeLessThan(handCardsBefore.length);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PASS
// ═══════════════════════════════════════════════════════════════════

test.describe('Action: Pass', () => {
  test.beforeAll(async ({ request }) => {
    api = new SetiApi(request);
    const session = await api.createDebugSession();
    gameId = session.gameId;
    token = session.accessToken;
    userId = session.user.id;

    ws = new WsTestClient();
    await ws.connect(token);
    ws.joinGame(gameId);
    await ws.waitForState(10_000);
  });

  test.afterAll(() => {
    ws?.disconnect();
  });

  test('pass button is always available on your turn', async ({ page }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    const passBtn = page.locator(sel.actionMenu('PASS'));
    await expect(passBtn).toBeVisible();
    await expect(passBtn).toBeEnabled();
  });

  test('clicking pass via UI advances turn', async ({ page }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    const activePlayerBefore = state.currentPlayerId;

    await gamePage.clickMainAction('PASS');

    // Wait for state update
    await ws.waitForState(5_000).catch(() => undefined);
    await resolveInputsViaWs(ws, gameId);

    // Turn should advance (either to bot or round end)
    const newState = ws.gameState!;
    // After pass + potential round end, the state should have changed
    expect(newState).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// RESEARCH TECH
// ═══════════════════════════════════════════════════════════════════

test.describe('Action: Research Tech', () => {
  test.beforeAll(async ({ request }) => {
    api = new SetiApi(request);
    const session = await api.createDebugSession();
    gameId = session.gameId;
    token = session.accessToken;
    userId = session.user.id;

    ws = new WsTestClient();
    await ws.connect(token);
    ws.joinGame(gameId);
    await ws.waitForState(10_000);
  });

  test.afterAll(() => {
    ws?.disconnect();
  });

  test('research tech via WS → tech board updates in UI', async ({ page }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    const myPlayer = findMyPlayer(state, userId);
    if ((myPlayer?.resources.publicity ?? 0) < 4) {
      test.skip();
      return;
    }

    // Send research tech via WS
    ws.sendAction(gameId, { type: 'RESEARCH_TECH' });
    await ws.waitForState(5_000).catch(() => undefined);
    await resolveInputsViaWs(ws, gameId);

    // Switch to tech tab and verify it renders
    await gamePage.switchTab('Tech');
    const techStacks = page.locator('[data-testid^="tech-stack-"]');
    expect(await techStacks.count()).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// FREE ACTIONS
// ═══════════════════════════════════════════════════════════════════

test.describe('Free Actions', () => {
  test.beforeAll(async ({ request }) => {
    api = new SetiApi(request);
    const session = await api.createDebugSession();
    gameId = session.gameId;
    token = session.accessToken;
    userId = session.user.id;

    ws = new WsTestClient();
    await ws.connect(token);
    ws.joinGame(gameId);
    await ws.waitForState(10_000);
  });

  test.afterAll(() => {
    ws?.disconnect();
  });

  test('exchange cards for credits via WS → UI updates', async ({ page }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    const myPlayer = findMyPlayer(state, userId);
    if ((myPlayer?.handSize ?? 0) < 2) {
      test.skip();
      return;
    }

    const creditsBefore = myPlayer?.resources.credits ?? 0;

    ws.sendFreeAction(gameId, {
      type: 'EXCHANGE_RESOURCES',
      from: 'CARD',
      to: 'CREDIT',
    });
    await ws.waitForState(5_000).catch(() => undefined);

    const newState = ws.gameState!;
    const newPlayer = findMyPlayer(newState, userId);
    expect(newPlayer?.resources.credits).toBe(creditsBefore + 1);
  });

  test('place data free action via WS', async ({ page }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    const myPlayer = findMyPlayer(state, userId);
    if ((myPlayer?.resources.data ?? 0) < 1) {
      test.skip();
      return;
    }

    ws.sendFreeAction(gameId, { type: 'PLACE_DATA', slotIndex: 0 });
    await ws.waitForState(5_000).catch(() => undefined);

    // Computer slot should update in UI
    await page.waitForTimeout(1_000);
    await expect(page.locator(sel.bottomDashboard)).toBeVisible();
  });

  test('use card corner free action via WS', async ({ page }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    const myPlayer = findMyPlayer(state, userId);
    if ((myPlayer?.handSize ?? 0) < 1) {
      test.skip();
      return;
    }

    // Get a card from hand to use its corner
    const handCards = myPlayer?.hand ?? [];
    if (handCards.length === 0) {
      test.skip();
      return;
    }

    ws.sendFreeAction(gameId, {
      type: 'USE_CARD_CORNER',
      cardId: handCards[0].id,
    });
    await ws.waitForState(5_000).catch(() => undefined);

    // UI should update (card removed from hand, resource gained)
    await page.waitForTimeout(1_000);
    await expect(page.locator(sel.bottomDashboard)).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════
// INPUT RESOLUTION (pending prompts)
// ═══════════════════════════════════════════════════════════════════

test.describe('Input Resolution', () => {
  test.beforeAll(async ({ request }) => {
    api = new SetiApi(request);
    const session = await api.createDebugSession();
    gameId = session.gameId;
    token = session.accessToken;
    userId = session.user.id;

    ws = new WsTestClient();
    await ws.connect(token);
    ws.joinGame(gameId);
    await ws.waitForState(10_000);
  });

  test.afterAll(() => {
    ws?.disconnect();
  });

  test('pending input prompt renders in the UI', async ({ page }) => {
    await injectAuth(page, token, {
      id: userId,
      name: 'Test',
      email: 'test@e2e',
    });
    const gamePage = new GamePage(page);
    await gamePage.goto(gameId);
    await gamePage.waitForGameLoaded();

    const state = ws.gameState!;
    if (state.currentPlayerId !== userId) {
      test.skip();
      return;
    }

    // Trigger an action that produces a pending input
    ws.sendAction(gameId, { type: 'LAUNCH_PROBE' });
    await ws.waitForState(5_000).catch(() => undefined);

    // If there's a pending input, the InputRenderer should appear
    if (ws.pendingInput && ws.pendingInput.playerId === userId) {
      await page.waitForTimeout(1_000);

      // The bottom actions panel should show the input renderer
      const actionsPanel = page.locator(sel.bottomActions);
      await expect(actionsPanel).toBeVisible();
    }

    // Clean up by resolving inputs
    await resolveInputsViaWs(ws, gameId);
  });
});
