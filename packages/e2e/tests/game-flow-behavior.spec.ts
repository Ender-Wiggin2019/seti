import { expect, type Page, type TestInfo, test } from '@playwright/test';
import { EPlanet, EResource, ETrace } from '../../common/src/types/element';
import { ETechId } from '../../common/src/types/tech';
import { SetiApi } from '../helpers/api';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';
import { type IWsGameState, WsTestClient } from '../helpers/ws-client';

const BEHAVIOR_FLOW_SEED = 'behavior-flow-seed';
const BEHAVIOR_FLOW_SCENARIO_PRESET = 'behavior-flow';

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

function getCardIds(
  cards: Array<{ id: string } | string> | undefined,
): string[] {
  return (cards ?? []).map((card) =>
    typeof card === 'string' ? card : card.id,
  );
}

function getOptionId(entry: { id: string; label?: string } | string): string {
  return typeof entry === 'string' ? entry : entry.id;
}

function selectPreferredId(
  entries: Array<{ id: string; label?: string } | string>,
  preferredIds: string[],
): string | null {
  if (!entries.length) {
    return null;
  }

  const optionIds = entries.map(getOptionId);
  return (
    preferredIds.find((id) => optionIds.includes(id)) ??
    optionIds.find((id) => id === 'done') ??
    optionIds.find((id) => id === 'skip-missions') ??
    optionIds[0] ??
    null
  );
}

function getProbeSpaceId(
  state: IWsGameState,
  playerId: string,
): string | undefined {
  return state.solarSystem.probes.find((probe) => probe.playerId === playerId)
    ?.spaceId;
}

function getDiscAngles(state: IWsGameState): number[] {
  return (state.solarSystem.discs ?? []).map((disc) => disc.angle);
}

function getPlanetLandingSlots(
  state: IWsGameState,
  planet: EPlanet,
): Array<{ playerId: string }> {
  return state.planetaryBoard?.planets?.[planet]?.landingSlots ?? [];
}

function getPlayerSignalCount(state: IWsGameState, playerId: string): number {
  return state.sectors.reduce(
    (count, sector) =>
      count +
      (sector.signals?.filter(
        (signal) => signal.type === 'player' && signal.playerId === playerId,
      ).length ?? 0),
    0,
  );
}

function getResource(
  player: ReturnType<typeof getPlayer>,
  resource: 'credit' | 'energy' | 'publicity' | 'data',
): number {
  const resources = player.resources as Record<string, number | undefined>;
  if (resource === 'credit') {
    return resources.credit ?? resources.credits ?? 0;
  }
  return resources[resource] ?? 0;
}

function assertNoNewErrors(
  ws: WsTestClient,
  beforeErrorCount: number,
  stepName: string,
): void {
  const newErrors = ws.errors.slice(beforeErrorCount);
  expect(newErrors, `${stepName} should not emit game:error`).toEqual([]);
}

async function waitForNextState(
  ws: WsTestClient,
  stepName: string,
  timeoutMs = 10_000,
): Promise<IWsGameState> {
  try {
    return await ws.waitForState(timeoutMs);
  } catch (error) {
    const state = ws.gameState;
    const latestError = ws.errors.at(-1);
    const pendingInput = ws.pendingInput;
    throw new Error(
      `${stepName}: ${error instanceof Error ? error.message : String(error)} | currentPlayer=${state?.currentPlayerId ?? 'unknown'} round=${state?.round ?? 'unknown'} latestError=${JSON.stringify(latestError ?? null)} pendingInput=${JSON.stringify(pendingInput ?? null)}`,
    );
  }
}

async function waitForProjectedState(
  api: SetiApi,
  gameId: string,
  viewerId: string,
  predicate: (state: IWsGameState) => boolean,
  stepName: string,
  timeoutMs = 30_000,
): Promise<IWsGameState> {
  const deadline = Date.now() + timeoutMs;
  let lastState: IWsGameState | null = null;

  while (Date.now() < deadline) {
    try {
      const state = (await api.debugGetState(
        gameId,
        viewerId,
      )) as unknown as IWsGameState;
      lastState = state;
      if (predicate(state)) {
        return state;
      }
    } catch (error) {
      if (!String(error).includes('429')) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(
    `${stepName}: projected state did not reach expected shape | currentPlayer=${lastState?.currentPlayerId ?? 'unknown'} round=${lastState?.round ?? 'unknown'} phase=${String(lastState?.phase ?? 'unknown')}`,
  );
}

async function sendMainActionAndWaitForProjection(
  ws: WsTestClient,
  api: SetiApi,
  gameId: string,
  viewerId: string,
  action: Record<string, unknown>,
  stepName: string,
  predicate: (state: IWsGameState) => boolean,
): Promise<IWsGameState> {
  const beforeErrorCount = ws.errors.length;
  ws.sendAction(gameId, action);
  const next = await waitForProjectedState(
    api,
    gameId,
    viewerId,
    predicate,
    stepName,
  );
  assertNoNewErrors(ws, beforeErrorCount, stepName);
  return next;
}

async function sendFreeActionAndWaitForProjection(
  ws: WsTestClient,
  api: SetiApi,
  gameId: string,
  viewerId: string,
  action: Record<string, unknown>,
  stepName: string,
  predicate: (state: IWsGameState) => boolean,
): Promise<IWsGameState> {
  const beforeErrorCount = ws.errors.length;
  ws.sendFreeAction(gameId, action);
  const next = await waitForProjectedState(
    api,
    gameId,
    viewerId,
    predicate,
    stepName,
  );
  assertNoNewErrors(ws, beforeErrorCount, stepName);
  return next;
}

async function resolvePendingInputs(
  api: SetiApi,
  ws: WsTestClient,
  gameId: string,
  playerId: string,
  preferredOptionIds: string[] = [],
): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    let input = null;
    try {
      input = await api.debugGetPendingInput(gameId, playerId);
    } catch (error) {
      if (!String(error).includes('429')) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      continue;
    }
    if (!input) {
      return;
    }
    const inputType = String(input.type).toLowerCase();

    if (inputType === 'option') {
      const options = (input.options ?? []) as Array<
        { id: string; label?: string } | string
      >;
      const selectedOptionId = selectPreferredId(options, preferredOptionIds);
      if (!selectedOptionId) {
        return;
      }

      const stepName = `resolve OPTION(${selectedOptionId})`;
      const beforeErrorCount = ws.errors.length;
      ws.sendInput(gameId, { type: input.type, optionId: selectedOptionId });
      await new Promise((resolve) => setTimeout(resolve, 150));
      assertNoNewErrors(ws, beforeErrorCount, stepName);
      continue;
    }

    if (inputType === 'card') {
      const cardId = input.cards?.[0]?.id;
      if (!cardId) {
        return;
      }

      const stepName = `resolve CARD(${cardId})`;
      const beforeErrorCount = ws.errors.length;
      ws.sendInput(gameId, { type: input.type, cardIds: [cardId] });
      await new Promise((resolve) => setTimeout(resolve, 150));
      assertNoNewErrors(ws, beforeErrorCount, stepName);
      continue;
    }

    if (inputType === 'endofround') {
      const cardId = input.cards?.[0]?.id;
      if (!cardId) {
        return;
      }

      const stepName = `resolve END_OF_ROUND(${cardId})`;
      const beforeErrorCount = ws.errors.length;
      ws.sendInput(gameId, { type: input.type, cardId });
      await new Promise((resolve) => setTimeout(resolve, 150));
      assertNoNewErrors(ws, beforeErrorCount, stepName);
      continue;
    }

    if (inputType === 'trace') {
      const options = (input.options ?? []) as Array<
        { id: string; label?: string } | string
      >;
      const trace = selectPreferredId(options, preferredOptionIds);
      if (!trace) {
        return;
      }

      const stepName = `resolve TRACE(${trace})`;
      const beforeErrorCount = ws.errors.length;
      ws.sendInput(gameId, { type: input.type, trace });
      await new Promise((resolve) => setTimeout(resolve, 150));
      assertNoNewErrors(ws, beforeErrorCount, stepName);
      continue;
    }

    if (inputType === 'tech') {
      const options = (input.options ?? []) as Array<
        { id: string; label?: string } | string
      >;
      const tech = selectPreferredId(options, preferredOptionIds);
      if (!tech) {
        return;
      }

      const stepName = `resolve TECH(${tech})`;
      const beforeErrorCount = ws.errors.length;
      ws.sendInput(gameId, { type: input.type, tech });
      await new Promise((resolve) => setTimeout(resolve, 150));
      assertNoNewErrors(ws, beforeErrorCount, stepName);
      continue;
    }

    if (inputType === 'goldtile') {
      const options = (input.options ?? []) as Array<
        { id: string; label?: string } | string
      >;
      const tileId = selectPreferredId(options, preferredOptionIds);
      if (!tileId) {
        return;
      }

      const stepName = `resolve GOLD_TILE(${tileId})`;
      const beforeErrorCount = ws.errors.length;
      ws.sendInput(gameId, { type: input.type, tileId });
      await new Promise((resolve) => setTimeout(resolve, 150));
      assertNoNewErrors(ws, beforeErrorCount, stepName);
      continue;
    }

    return;
  }
}

async function ensurePlayerTurn(
  api: SetiApi,
  actorWs: WsTestClient,
  opponentWs: WsTestClient,
  gameId: string,
  actorId: string,
  opponentId: string,
): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const state = actorWs.gameState ?? (await actorWs.waitForState(10_000));
    if (state.currentPlayerId === actorId) {
      return;
    }

    if (state.currentPlayerId !== opponentId) {
      throw new Error(
        `Unexpected active player: ${state.currentPlayerId}, expected ${actorId} or ${opponentId}`,
      );
    }

    await resolvePendingInputs(api, opponentWs, gameId, opponentId);
    await sendMainActionAndWaitForProjection(
      opponentWs,
      api,
      gameId,
      actorId,
      { type: 'PASS' },
      'opponent PASS to return turn',
      (nextState) => nextState.currentPlayerId === actorId,
    );
    await resolvePendingInputs(api, opponentWs, gameId, opponentId);
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

test('behavior flow e2e: real auth/lobby path with deterministic engine scenario', async ({
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

  const room = await hostApi.createRoom(`Behavior Room ${suffix}`, 2, {
    seed: BEHAVIOR_FLOW_SEED,
    scenarioPreset: BEHAVIOR_FLOW_SCENARIO_PRESET,
  });
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
  await attachStepScreenshot(page, testInfo, 'behavior-flow-loaded');

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
      waitForNextState(hostWs, 'host initial room join'),
      waitForNextState(guestWs, 'guest initial room join'),
    ]);

    const initialState = hostWs.gameState;
    expect(initialState).toBeTruthy();
    expect(initialState?.round).toBe(1);
    expect(initialState?.players).toHaveLength(2);

    const initialHost = getPlayer(
      initialState ??
        (() => {
          throw new Error('Expected initial host state to exist');
        })(),
      hostId,
    );
    expect(getCardIds(initialHost.hand)).toEqual(['80', '16', '130', '110']);
    expect(getResource(initialHost, 'credit')).toBe(4);
    expect(getResource(initialHost, 'energy')).toBe(4);
    expect(getResource(initialHost, 'publicity')).toBe(4);
    expect(initialHost.score).toBe(1);

    await ensurePlayerTurn(
      hostApi,
      hostWs,
      guestWs,
      resolvedGameId,
      hostId,
      guestId,
    );

    let hostState = await sendMainActionAndWaitForProjection(
      hostWs,
      hostApi,
      resolvedGameId,
      hostId,
      { type: 'PLAY_CARD', payload: { cardIndex: 0 } },
      'host PLAY_CARD(80)',
      (state) => {
        const player = getPlayer(state, hostId);
        return (
          getCardIds(player.hand).join(',') === '16,130,110' &&
          getCardIds(player.playedMissions).includes('80')
        );
      },
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId);
    hostState = await waitForProjectedState(
      hostApi,
      resolvedGameId,
      hostId,
      () => true,
      'refresh projected state after play-card inputs',
    );

    let hostPlayer = getPlayer(hostState, hostId);
    expect(getResource(hostPlayer, 'credit')).toBe(3);
    expect(getCardIds(hostPlayer.hand)).toEqual(['16', '130', '110']);
    expect(getCardIds(hostPlayer.playedMissions)).toContain('80');

    const rotationBeforeGuestPass = getDiscAngles(hostState);
    if (hostState.currentPlayerId !== hostId) {
      await resolvePendingInputs(hostApi, guestWs, resolvedGameId, guestId);
      const guestPassErrorCount = guestWs.errors.length;
      guestWs.sendAction(resolvedGameId, { type: 'PASS' });
      hostState = await waitForProjectedState(
        hostApi,
        resolvedGameId,
        hostId,
        () => true,
        'guest PASS after host played card',
      );
      assertNoNewErrors(
        guestWs,
        guestPassErrorCount,
        'guest PASS after host played card',
      );
      await resolvePendingInputs(hostApi, guestWs, resolvedGameId, guestId);
      hostState = await waitForProjectedState(
        hostApi,
        resolvedGameId,
        hostId,
        (state) => state.currentPlayerId === hostId,
        'guest PASS resolves back to host turn',
      );
      expect(getDiscAngles(hostState)).not.toEqual(rotationBeforeGuestPass);
    }
    expect(hostState.currentPlayerId).toBe(hostId);

    hostState = await sendMainActionAndWaitForProjection(
      hostWs,
      hostApi,
      resolvedGameId,
      hostId,
      { type: 'LAUNCH_PROBE' },
      'host LAUNCH_PROBE',
      (state) => getProbeSpaceId(state, hostId) === 'ring-1-cell-4',
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId, [
      'complete-80-0',
      'complete-80-1',
      'skip-missions',
    ]);

    hostState = await waitForProjectedState(
      hostApi,
      resolvedGameId,
      hostId,
      () => true,
      'refresh projected state after launch inputs',
    );
    hostPlayer = getPlayer(hostState, hostId);
    expect(getResource(hostPlayer, 'credit')).toBe(1);
    expect(hostPlayer.probesInSpace).toBe(1);
    expect(hostPlayer.movementPoints).toBe(2);
    expect(getProbeSpaceId(hostState, hostId)).toBe('ring-1-cell-4');

    hostState = await sendFreeActionAndWaitForProjection(
      hostWs,
      hostApi,
      resolvedGameId,
      hostId,
      { type: 'MOVEMENT', path: ['ring-1-cell-4', 'ring-1-cell-3'] },
      'host MOVEMENT Earth->Asteroid',
      (state) => getProbeSpaceId(state, hostId) === 'ring-1-cell-3',
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId);

    hostPlayer = getPlayer(hostState, hostId);
    expect(hostPlayer.movementPoints).toBe(1);
    expect(getProbeSpaceId(hostState, hostId)).toBe('ring-1-cell-3');

    hostState = await sendFreeActionAndWaitForProjection(
      hostWs,
      hostApi,
      resolvedGameId,
      hostId,
      { type: 'CONVERT_ENERGY_TO_MOVEMENT', amount: 1 },
      'host CONVERT_ENERGY_TO_MOVEMENT',
      (state) => getResource(getPlayer(state, hostId), 'energy') === 3,
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId);

    hostPlayer = getPlayer(hostState, hostId);
    expect(getResource(hostPlayer, 'energy')).toBe(3);
    expect(hostPlayer.movementPoints).toBe(2);

    hostState = await sendFreeActionAndWaitForProjection(
      hostWs,
      hostApi,
      resolvedGameId,
      hostId,
      { type: 'MOVEMENT', path: ['ring-1-cell-3', 'ring-1-cell-2'] },
      'host MOVEMENT Asteroid->Venus',
      (state) => getProbeSpaceId(state, hostId) === 'ring-1-cell-2',
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId);

    hostPlayer = getPlayer(hostState, hostId);
    expect(getResource(hostPlayer, 'publicity')).toBe(5);
    expect(hostPlayer.movementPoints).toBe(0);
    expect(getProbeSpaceId(hostState, hostId)).toBe('ring-1-cell-2');

    const dragonflyIndex = getCardIds(hostPlayer.hand).indexOf('16');
    expect(dragonflyIndex).toBeGreaterThanOrEqual(0);

    hostState = await sendMainActionAndWaitForProjection(
      hostWs,
      hostApi,
      resolvedGameId,
      hostId,
      { type: 'PLAY_CARD', payload: { cardIndex: dragonflyIndex } },
      'host PLAY_CARD(16)',
      () => true,
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId, [
      `land-${EPlanet.VENUS}`,
      ETrace.YELLOW,
      `alien-0-discovery-${ETrace.YELLOW}`,
      'done',
    ]);

    hostState = await waitForProjectedState(
      hostApi,
      resolvedGameId,
      hostId,
      (state) =>
        getPlanetLandingSlots(state, EPlanet.VENUS).some(
          (slot) => slot.playerId === hostId,
        ) && getProbeSpaceId(state, hostId) === undefined,
      'host Dragonfly resolves landing and trace',
    );

    hostPlayer = getPlayer(hostState, hostId);
    expect(getCardIds(hostPlayer.hand)).toEqual(['130', '110']);
    expect(getResource(hostPlayer, 'credit')).toBe(0);
    expect(getResource(hostPlayer, 'energy')).toBe(0);
    expect(getResource(hostPlayer, 'publicity')).toBe(6);
    expect(getResource(hostPlayer, 'data')).toBeGreaterThanOrEqual(1);
    expect(hostPlayer.score).toBeGreaterThanOrEqual(9);
    expect(hostPlayer.probesInSpace).toBe(0);
    expect(
      getPlanetLandingSlots(hostState, EPlanet.VENUS).some(
        (slot) => slot.playerId === hostId,
      ),
    ).toBe(true);

    const dataBeforeCorner = getResource(hostPlayer, 'data');
    hostState = await sendFreeActionAndWaitForProjection(
      hostWs,
      hostApi,
      resolvedGameId,
      hostId,
      { type: 'USE_CARD_CORNER', cardId: '110' },
      'host USE_CARD_CORNER(110)',
      (state) => {
        const player = getPlayer(state, hostId);
        return (
          !getCardIds(player.hand).includes('110') &&
          getResource(player, 'data') === dataBeforeCorner + 1
        );
      },
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId);

    hostPlayer = getPlayer(hostState, hostId);
    expect(getCardIds(hostPlayer.hand)).toEqual(['130']);
    expect(getResource(hostPlayer, 'data')).toBe(dataBeforeCorner + 1);

    const rotationBeforeResearch = getDiscAngles(hostState);
    hostState = await sendMainActionAndWaitForProjection(
      hostWs,
      hostApi,
      resolvedGameId,
      hostId,
      { type: 'RESEARCH_TECH' },
      'host RESEARCH_TECH',
      () => true,
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId, [
      ETechId.COMPUTER_VP_CREDIT,
      'col-0',
      'done',
    ]);

    hostState = await waitForProjectedState(
      hostApi,
      resolvedGameId,
      hostId,
      (state) => {
        const player = getPlayer(state, hostId);
        return (
          player.techs?.includes(ETechId.COMPUTER_VP_CREDIT) === true &&
          player.computer?.columns?.[0]?.techId === ETechId.COMPUTER_VP_CREDIT
        );
      },
      'host RESEARCH_TECH resolves',
    );

    hostPlayer = getPlayer(hostState, hostId);
    expect(hostPlayer.techs).toContain(ETechId.COMPUTER_VP_CREDIT);
    expect(hostPlayer.computer?.columns?.[0]?.techId).toBe(
      ETechId.COMPUTER_VP_CREDIT,
    );
    expect(hostPlayer.computer?.columns?.[0]?.topFilled).toBe(false);
    expect(getResource(hostPlayer, 'publicity')).toBe(0);
    expect(getDiscAngles(hostState)).not.toEqual(rotationBeforeResearch);

    const scoreBeforePlaceData = hostPlayer.score;
    const publicityBeforePlaceData = getResource(hostPlayer, 'publicity');

    hostState = await sendFreeActionAndWaitForProjection(
      hostWs,
      hostApi,
      resolvedGameId,
      hostId,
      { type: 'PLACE_DATA', slotIndex: 0 },
      'host PLACE_DATA(0)',
      (state) =>
        getPlayer(state, hostId).computer?.columns?.[0]?.topFilled === true,
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId);

    hostState = await sendFreeActionAndWaitForProjection(
      hostWs,
      hostApi,
      resolvedGameId,
      hostId,
      { type: 'PLACE_DATA', slotIndex: 1 },
      'host PLACE_DATA(1)',
      (state) =>
        getPlayer(state, hostId).computer?.columns?.[1]?.topFilled === true,
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId);

    hostPlayer = getPlayer(hostState, hostId);
    expect(hostPlayer.computer?.columns?.[0]?.topFilled).toBe(true);
    expect(hostPlayer.computer?.columns?.[1]?.topFilled).toBe(true);
    expect(hostPlayer.score).toBe(scoreBeforePlaceData + 2);
    expect(getResource(hostPlayer, 'publicity')).toBe(
      publicityBeforePlaceData + 1,
    );

    const hostPassErrorCount = hostWs.errors.length;
    hostWs.sendAction(resolvedGameId, { type: 'PASS' });
    hostState = await waitForProjectedState(
      hostApi,
      resolvedGameId,
      hostId,
      (state) => String(state.phase) === 'IN_RESOLUTION' || state.round === 2,
      'host PASS enters resolution',
    );
    assertNoNewErrors(
      hostWs,
      hostPassErrorCount,
      'host PASS enters resolution',
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId);

    hostState = await waitForProjectedState(
      hostApi,
      resolvedGameId,
      hostId,
      (state) => state.round === 2,
      'host PASS resolves round 2',
    );

    hostPlayer = getPlayer(hostState, hostId);
    expect(hostState.round).toBe(2);
    expect(hostState.currentPlayerId).toBe(guestId);
    expect(getResource(hostPlayer, 'energy')).toBeGreaterThanOrEqual(2);
    expect(getCardIds(hostPlayer.hand).length).toBeGreaterThanOrEqual(2);

    const guestRoundTwoPassErrorCount = guestWs.errors.length;
    guestWs.sendAction(resolvedGameId, { type: 'PASS' });
    hostState = await waitForProjectedState(
      hostApi,
      resolvedGameId,
      hostId,
      (state) => String(state.phase) === 'IN_RESOLUTION',
      'guest PASS enters resolution in round 2',
    );
    assertNoNewErrors(
      guestWs,
      guestRoundTwoPassErrorCount,
      'guest PASS enters resolution in round 2',
    );
    await resolvePendingInputs(hostApi, guestWs, resolvedGameId, guestId);

    hostState = await waitForProjectedState(
      hostApi,
      resolvedGameId,
      hostId,
      (state) => state.currentPlayerId === hostId,
      'guest PASS resolves back to host in round 2',
    );

    hostPlayer = getPlayer(hostState, hostId);
    expect(hostState.round).toBe(2);
    expect(hostState.currentPlayerId).toBe(hostId);

    if (getResource(hostPlayer, 'credit') < 1) {
      hostState = await sendFreeActionAndWaitForProjection(
        hostWs,
        hostApi,
        resolvedGameId,
        hostId,
        {
          type: 'EXCHANGE_RESOURCES',
          from: EResource.CARD,
          to: EResource.CREDIT,
        },
        'host EXCHANGE_RESOURCES(CARD->CREDIT)',
        (state) => getResource(getPlayer(state, hostId), 'credit') >= 1,
      );
      await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId);
      hostPlayer = getPlayer(hostState, hostId);
    }

    expect(getResource(hostPlayer, 'credit')).toBeGreaterThanOrEqual(1);
    expect(getResource(hostPlayer, 'energy')).toBeGreaterThanOrEqual(2);

    const creditsBeforeScan = getResource(hostPlayer, 'credit');
    const energyBeforeScan = getResource(hostPlayer, 'energy');
    const dataBeforeScan = getResource(hostPlayer, 'data');
    const scoreBeforeScan = hostPlayer.score;
    const signalCountBeforeScan = getPlayerSignalCount(hostState, hostId);

    hostState = await sendMainActionAndWaitForProjection(
      hostWs,
      hostApi,
      resolvedGameId,
      hostId,
      { type: 'SCAN' },
      'host SCAN in round 2',
      () => true,
    );
    await resolvePendingInputs(hostApi, hostWs, resolvedGameId, hostId, [
      'mark-card-row',
      'mark-earth',
      'done',
    ]);

    hostState = await waitForProjectedState(
      hostApi,
      resolvedGameId,
      hostId,
      (state) => getPlayerSignalCount(state, hostId) > signalCountBeforeScan,
      'host SCAN resolves sector markers',
    );

    hostPlayer = getPlayer(hostState, hostId);
    const signalCountAfterScan = getPlayerSignalCount(hostState, hostId);
    expect(getResource(hostPlayer, 'credit')).toBeLessThanOrEqual(
      creditsBeforeScan - 1,
    );
    expect(getResource(hostPlayer, 'energy')).toBeLessThanOrEqual(
      energyBeforeScan - 2,
    );
    expect(getResource(hostPlayer, 'data')).toBeGreaterThanOrEqual(
      dataBeforeScan + 1,
    );
    expect(signalCountAfterScan).toBeGreaterThan(signalCountBeforeScan);
    expect(hostPlayer.score).toBeGreaterThanOrEqual(scoreBeforeScan);

    await expect(page.locator(sel.bottomDashboard)).toBeVisible();
    await attachStepScreenshot(page, testInfo, 'behavior-flow-after-scan');
  } finally {
    hostWs.disconnect();
    guestWs.disconnect();
  }
});
