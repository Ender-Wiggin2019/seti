import { expect, type Page, type TestInfo, test } from '@playwright/test';
import { SetiApi } from '../helpers/api';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';
import { type IWsGameState, WsTestClient } from '../helpers/ws-client';

interface IUserCred {
  name: string;
  email: string;
  password: string;
}

function getPlayer(state: IWsGameState, playerId: string) {
  const player = state.players.find((entry) => entry.playerId === playerId);
  if (!player) {
    throw new Error(`Player ${playerId} not found in current state`);
  }
  return player;
}

function getOptionId(entry: { id: string; label?: string } | string): string {
  return typeof entry === 'string' ? entry : entry.id;
}

function pickCardIndexToPlay(player: ReturnType<typeof getPlayer>): number {
  const cards = player.hand ?? [];
  const credits = player.resources.credits;

  const affordableCreditCardIndex = cards.findIndex((card) => {
    if (typeof card === 'string') {
      return false;
    }
    const price = typeof card.price === 'number' ? card.price : Number.NaN;
    const priceType = card.priceType ?? 'credit';
    return Number.isFinite(price) && priceType === 'credit' && price <= credits;
  });

  return affordableCreditCardIndex;
}

function findSimpleProbePath(
  state: IWsGameState,
  playerId: string,
): string[] | null {
  const probe = state.solarSystem.probes.find((p) => p.playerId === playerId);
  if (!probe) {
    return null;
  }

  const neighbors = state.solarSystem.adjacency[probe.spaceId] ?? [];
  const target = neighbors.find((spaceId) => {
    const elementTypes =
      state.solarSystem.spaceStates?.[spaceId]?.elementTypes ?? [];
    return !elementTypes.includes('SUN');
  });

  return target ? [probe.spaceId, target] : null;
}

function assertNoNewErrors(
  ws: WsTestClient,
  beforeErrorCount: number,
  stepName: string,
): void {
  const newErrors = ws.errors.slice(beforeErrorCount);
  expect(newErrors, `${stepName} should not emit game:error`).toEqual([]);
}

async function sendMainActionAndExpectState(
  ws: WsTestClient,
  gameId: string,
  action: Record<string, unknown>,
  stepName: string,
): Promise<IWsGameState> {
  const beforeErrorCount = ws.errors.length;
  ws.sendAction(gameId, action);
  const next = await ws.waitForState(10_000);
  assertNoNewErrors(ws, beforeErrorCount, stepName);
  return next;
}

async function sendFreeActionAndExpectState(
  ws: WsTestClient,
  gameId: string,
  action: Record<string, unknown>,
  stepName: string,
): Promise<IWsGameState> {
  const beforeErrorCount = ws.errors.length;
  ws.sendFreeAction(gameId, action);
  const next = await ws.waitForState(10_000);
  assertNoNewErrors(ws, beforeErrorCount, stepName);
  return next;
}

async function sendInputAndExpectState(
  ws: WsTestClient,
  gameId: string,
  inputResponse: Record<string, unknown>,
  stepName: string,
): Promise<IWsGameState> {
  const beforeErrorCount = ws.errors.length;
  ws.sendInput(gameId, inputResponse);
  const next = await ws.waitForState(10_000);
  assertNoNewErrors(ws, beforeErrorCount, stepName);
  return next;
}

async function resolvePendingInputs(
  ws: WsTestClient,
  gameId: string,
  playerId: string,
): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const pending = ws.pendingInput;
    if (!pending || pending.playerId !== playerId) {
      return;
    }

    const input = pending.input;
    const inputType = String(input.type).toLowerCase();

    if (inputType === 'option') {
      const options = (input.options ?? []) as Array<
        { id: string; label?: string } | string
      >;
      if (!options.length) return;

      const optionIds = options.map(getOptionId);
      const selectedOptionId =
        optionIds.find((id) => id === 'done') ??
        optionIds.find((id) => id === 'skip-missions') ??
        optionIds[0];

      await sendInputAndExpectState(
        ws,
        gameId,
        { type: 'OPTION', optionId: selectedOptionId },
        `resolve OPTION(${selectedOptionId})`,
      );
      continue;
    }

    if (inputType === 'card') {
      const cardId = input.cards?.[0]?.id;
      if (!cardId) return;

      await sendInputAndExpectState(
        ws,
        gameId,
        { type: 'CARD', cardIds: [cardId] },
        `resolve CARD(${cardId})`,
      );
      continue;
    }

    if (inputType === 'endofround') {
      const cardId = input.cards?.[0]?.id;
      if (!cardId) return;

      await sendInputAndExpectState(
        ws,
        gameId,
        { type: 'END_OF_ROUND', cardId },
        `resolve END_OF_ROUND(${cardId})`,
      );
      continue;
    }

    if (inputType === 'trace') {
      const options = (input.options ?? []) as Array<
        { id: string; label?: string } | string
      >;
      const trace = options.length ? getOptionId(options[0]) : null;
      if (!trace) return;

      await sendInputAndExpectState(
        ws,
        gameId,
        { type: 'TRACE', trace },
        `resolve TRACE(${trace})`,
      );
      continue;
    }

    if (inputType === 'tech') {
      const options = (input.options ?? []) as Array<
        { id: string; label?: string } | string
      >;
      const tech = options.length ? getOptionId(options[0]) : null;
      if (!tech) return;

      await sendInputAndExpectState(
        ws,
        gameId,
        { type: 'TECH', tech },
        `resolve TECH(${tech})`,
      );
      continue;
    }

    if (inputType === 'goldtile') {
      const options = (input.options ?? []) as Array<
        { id: string; label?: string } | string
      >;
      const tileId = options.length ? getOptionId(options[0]) : null;
      if (!tileId) return;

      await sendInputAndExpectState(
        ws,
        gameId,
        { type: 'GOLD_TILE', tileId },
        `resolve GOLD_TILE(${tileId})`,
      );
      continue;
    }

    return;
  }
}

async function ensurePlayerTurn(
  actorWs: WsTestClient,
  opponentWs: WsTestClient,
  gameId: string,
  actorId: string,
  opponentId: string,
): Promise<void> {
  for (let round = 0; round < 8; round += 1) {
    const state = actorWs.gameState ?? (await actorWs.waitForState(10_000));
    if (state.currentPlayerId === actorId) {
      return;
    }

    if (state.currentPlayerId !== opponentId) {
      throw new Error(
        `Unexpected active player: ${state.currentPlayerId}, expected ${actorId} or ${opponentId}`,
      );
    }

    await resolvePendingInputs(opponentWs, gameId, opponentId);
    await sendMainActionAndExpectState(
      opponentWs,
      gameId,
      { type: 'PASS' },
      'opponent PASS to hand turn over',
    );
    await resolvePendingInputs(opponentWs, gameId, opponentId);

    await actorWs.waitForState(10_000).catch(() => undefined);
  }

  throw new Error(`Failed to transfer turn to ${actorId} within retry budget`);
}

async function loginByUi(page: Page, user: IUserCred): Promise<void> {
  await page.goto('/auth');
  await page.locator('#login-email').fill(user.email);
  await page.locator('#login-password').fill(user.password);

  const loginResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/auth/login') && res.request().method() === 'POST',
  );

  await page.getByRole('button', { name: 'Access Terminal' }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBe(true);
  await page.waitForURL('**/lobby', { timeout: 15_000 });
}

async function attachStepScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> {
  const screenshotPath = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(name, {
    path: screenshotPath,
    contentType: 'image/png',
  });
}

test('behavior flow e2e (real path): register/login -> room -> game -> actions', async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(180_000);
  await waitForServerReady(request);

  const suffix = Date.now();
  const host: IUserCred = {
    name: 'Behavior Host',
    email: `behavior-host-${suffix}@e2e.test`,
    password: 'password123',
  };
  const guest: IUserCred = {
    name: 'Behavior Guest',
    email: `behavior-guest-${suffix}@e2e.test`,
    password: 'password123',
  };

  const hostApi = new SetiApi(request);
  const guestApi = new SetiApi(request);

  await hostApi.register(host.name, host.email, host.password);
  await guestApi.register(guest.name, guest.email, guest.password);

  const hostSession = await hostApi.login(host.email, host.password);
  const guestSession = await guestApi.login(guest.email, guest.password);

  const room = await hostApi.createRoom(`Behavior Room ${suffix}`, 2);
  await guestApi.joinRoom(room.id);

  await loginByUi(page, host);
  await page.goto(`/room/${room.id}`);

  const launchBtn = page.getByRole('button', { name: 'Launch Game' });
  await expect(launchBtn).toBeVisible({ timeout: 15_000 });
  await launchBtn.click();

  await page.waitForURL(/\/game\/[^/?#]+$/, { timeout: 15_000 });
  const gameId = page.url().split('/game/')[1]?.split(/[?#]/)[0];
  expect(gameId).toBeTruthy();

  await expect(page.locator(sel.bottomDashboard)).toBeVisible({
    timeout: 15_000,
  });
  await attachStepScreenshot(page, testInfo, 'behavior-real-flow-game-loaded');

  const resolvedGameId = gameId as string;
  const hostId = hostSession.user.id;
  const guestId = guestSession.user.id;

  const hostWs = new WsTestClient();
  const guestWs = new WsTestClient();

  try {
    await hostWs.connect(hostSession.accessToken);
    await guestWs.connect(guestSession.accessToken);

    hostWs.joinGame(resolvedGameId);
    guestWs.joinGame(resolvedGameId);

    await Promise.all([
      hostWs.waitForState(10_000),
      guestWs.waitForState(10_000),
    ]);

    const initialState = hostWs.gameState;
    expect(initialState).toBeTruthy();
    expect(initialState?.round).toBe(1);
    expect(initialState?.players).toHaveLength(2);

    await ensurePlayerTurn(hostWs, guestWs, resolvedGameId, hostId, guestId);

    // 1) PLAY_CARD (when there is an affordable credit-cost card)
    let hostState = hostWs.gameState!;
    let hostPlayer = getPlayer(hostState, hostId);
    const cardIndex = pickCardIndexToPlay(hostPlayer);

    if (cardIndex >= 0) {
      const beforeSnapshot = {
        handSize: hostPlayer.handSize,
        credits: hostPlayer.resources.credits,
        score: hostPlayer.score,
      };

      await sendMainActionAndExpectState(
        hostWs,
        resolvedGameId,
        { type: 'PLAY_CARD', payload: { cardIndex } },
        'host PLAY_CARD',
      );
      await resolvePendingInputs(hostWs, resolvedGameId, hostId);

      hostState = hostWs.gameState!;
      hostPlayer = getPlayer(hostState, hostId);
      const afterSnapshot = {
        handSize: hostPlayer.handSize,
        credits: hostPlayer.resources.credits,
        score: hostPlayer.score,
      };

      expect(afterSnapshot).not.toEqual(beforeSnapshot);
    }

    // 2) LAUNCH_PROBE (if resources allow)
    await ensurePlayerTurn(hostWs, guestWs, resolvedGameId, hostId, guestId);
    hostState = hostWs.gameState!;
    hostPlayer = getPlayer(hostState, hostId);

    if (hostPlayer.resources.credits >= 2) {
      const probesBefore = hostPlayer.probesInSpace ?? 0;

      await sendMainActionAndExpectState(
        hostWs,
        resolvedGameId,
        { type: 'LAUNCH_PROBE' },
        'host LAUNCH_PROBE',
      );
      await resolvePendingInputs(hostWs, resolvedGameId, hostId);

      hostState = hostWs.gameState!;
      hostPlayer = getPlayer(hostState, hostId);
      expect(hostPlayer.probesInSpace ?? 0).toBeGreaterThanOrEqual(
        probesBefore + 1,
      );
    }

    // 3) MOVEMENT chain (convert energy if needed)
    hostState = hostWs.gameState!;
    hostPlayer = getPlayer(hostState, hostId);

    if ((hostPlayer.probesInSpace ?? 0) > 0) {
      if (
        (hostPlayer.movementPoints ?? 0) <= 0 &&
        hostPlayer.resources.energy > 0
      ) {
        await sendFreeActionAndExpectState(
          hostWs,
          resolvedGameId,
          { type: 'CONVERT_ENERGY_TO_MOVEMENT', amount: 1 },
          'host CONVERT_ENERGY_TO_MOVEMENT',
        );
      }

      hostState = hostWs.gameState!;
      hostPlayer = getPlayer(hostState, hostId);

      const path = findSimpleProbePath(hostState, hostId);
      if (
        path &&
        ((hostPlayer.movementPoints ?? 0) > 0 ||
          hostPlayer.resources.energy > 0)
      ) {
        const probeSpaceBefore = hostState.solarSystem.probes.find(
          (probe) => probe.playerId === hostId,
        )?.spaceId;

        await sendFreeActionAndExpectState(
          hostWs,
          resolvedGameId,
          { type: 'MOVEMENT', path },
          'host MOVEMENT',
        );

        hostState = hostWs.gameState!;
        const probeSpaceAfter = hostState.solarSystem.probes.find(
          (probe) => probe.playerId === hostId,
        )?.spaceId;

        if (probeSpaceBefore && probeSpaceAfter) {
          expect(probeSpaceAfter).not.toBe(probeSpaceBefore);
        }
      }
    }

    // 4) SCAN (if resources allow)
    await ensurePlayerTurn(hostWs, guestWs, resolvedGameId, hostId, guestId);
    hostState = hostWs.gameState!;
    hostPlayer = getPlayer(hostState, hostId);

    if (hostPlayer.resources.credits >= 1 && hostPlayer.resources.energy >= 2) {
      const creditsBefore = hostPlayer.resources.credits;
      const energyBefore = hostPlayer.resources.energy;

      await sendMainActionAndExpectState(
        hostWs,
        resolvedGameId,
        { type: 'SCAN' },
        'host SCAN',
      );
      await resolvePendingInputs(hostWs, resolvedGameId, hostId);

      hostState = hostWs.gameState!;
      hostPlayer = getPlayer(hostState, hostId);
      expect(hostPlayer.resources.credits).toBeLessThanOrEqual(
        creditsBefore - 1,
      );
      expect(hostPlayer.resources.energy).toBeLessThanOrEqual(energyBefore - 2);
    }

    // 5) PASS and verify turn progression
    await ensurePlayerTurn(hostWs, guestWs, resolvedGameId, hostId, guestId);
    await sendMainActionAndExpectState(
      hostWs,
      resolvedGameId,
      { type: 'PASS' },
      'host PASS',
    );
    await resolvePendingInputs(hostWs, resolvedGameId, hostId);

    const postPass = await hostWs.waitForCondition(
      (state) => state.currentPlayerId !== hostId || state.round > 1,
      15_000,
    );
    expect(postPass.round).toBeGreaterThanOrEqual(1);

    await expect(page.locator(sel.bottomDashboard)).toBeVisible();
    await attachStepScreenshot(
      page,
      testInfo,
      'behavior-real-flow-after-actions',
    );
  } finally {
    hostWs.disconnect();
    guestWs.disconnect();
  }
});
