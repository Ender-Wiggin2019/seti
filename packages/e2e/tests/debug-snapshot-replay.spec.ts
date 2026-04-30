import { randomUUID } from 'node:crypto';
import { type APIRequestContext, expect, test } from '@playwright/test';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

interface IDebugSourceSession {
  gameId: string;
  user: { id: string };
}

interface IDebugPendingInput {
  type: string;
  options?: Array<{ id: string }>;
  cards?: Array<{ id: string }>;
}

async function createSourceDebugGame(
  request: APIRequestContext,
): Promise<IDebugSourceSession> {
  const sessionResponse = await request.post(
    `${SERVER_URL}/debug/server/session`,
  );
  expect(sessionResponse.ok()).toBe(true);
  const session = await sessionResponse.json();
  return session as IDebugSourceSession;
}

async function createVersionedSourceDebugGame(
  request: APIRequestContext,
): Promise<IDebugSourceSession> {
  const session = await createSourceDebugGame(request);
  await resolveFirstPendingInput(request, session);
  return session;
}

async function createReplaySourceDebugGame(
  request: APIRequestContext,
  replayRequest: {
    presetId: string;
    checkpointId: string;
    fieldValues?: Record<string, string>;
  },
): Promise<IDebugSourceSession> {
  const sessionResponse = await request.post(
    `${SERVER_URL}/debug/server/replay-session`,
    { data: replayRequest },
  );
  expect(sessionResponse.ok()).toBe(true);
  const session = await sessionResponse.json();
  return session as IDebugSourceSession;
}

async function resolveFirstPendingInput(
  request: APIRequestContext,
  session: IDebugSourceSession,
): Promise<void> {
  const pendingResponse = await request.get(
    `${SERVER_URL}/debug/server/game/${session.gameId}/pending/${session.user.id}`,
  );
  expect(pendingResponse.ok()).toBe(true);
  const pendingInput = (await pendingResponse.json()) as IDebugPendingInput;
  const inputResponse = buildFirstInputResponse(pendingInput);

  const inputResponseResult = await request.post(
    `${SERVER_URL}/debug/server/game/${session.gameId}/input`,
    {
      data: {
        playerId: session.user.id,
        inputResponse,
      },
    },
  );
  expect(inputResponseResult.ok()).toBe(true);
}

function buildFirstInputResponse(input: IDebugPendingInput): unknown {
  if (input.type === 'card') {
    const firstCardId = input.cards?.[0]?.id;
    expect(firstCardId).toBeTruthy();
    return { type: 'card', cardIds: [firstCardId] };
  }

  if (input.type === 'option') {
    const firstOptionId = input.options?.[0]?.id;
    expect(firstOptionId).toBeTruthy();
    return { type: 'option', optionId: firstOptionId };
  }

  throw new Error(`Unsupported debug pending input type: ${input.type}`);
}

test.describe('Debug Snapshot Replay', () => {
  test('can load a game from DB snapshot and render the game UI', async ({
    page,
    request,
  }) => {
    await waitForServerReady(request);
    const { gameId: sourceGameId } = await createSourceDebugGame(request);

    await page.goto('/debug/replay');

    await expect(page.getByTestId('debug-replay-preset')).toBeVisible({
      timeout: 15_000,
    });

    const gameIdInput = page.getByTestId('debug-snapshot-game-id');
    await expect(gameIdInput).toBeVisible();
    await gameIdInput.fill(sourceGameId);

    const snapshotResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/debug/server/snapshot-session') &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('debug-snapshot-start').click();
    expect((await snapshotResponse).ok()).toBe(true);

    await expect(page.locator('[data-testid="bottom-dashboard"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('shows an error for an invalid gameId', async ({ page, request }) => {
    await waitForServerReady(request);

    await page.goto('/debug/replay');
    await expect(page.getByTestId('debug-replay-preset')).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId('debug-snapshot-game-id').fill(randomUUID());
    const snapshotResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/debug/server/snapshot-session') &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('debug-snapshot-start').click();
    expect((await snapshotResponse).ok()).toBe(false);

    await expect(
      page.getByText('Request failed with status code 500'),
    ).toBeVisible();
  });

  test('loads a specified snapshot version and exposes replay metadata', async ({
    page,
    request,
  }) => {
    await waitForServerReady(request);
    const { gameId: sourceGameId } =
      await createVersionedSourceDebugGame(request);

    await page.goto('/debug/replay');
    await expect(page.getByTestId('debug-replay-preset')).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId('debug-snapshot-game-id').fill(sourceGameId);
    await page.getByTestId('debug-snapshot-version').fill('1');
    const snapshotResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/debug/server/snapshot-session') &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('debug-snapshot-start').click();
    const response = await snapshotResponse;
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.snapshotVersion).toBe(1);

    await expect(page.getByText('Snapshot')).toBeVisible();
    await expect(
      page.getByText(`R${body.round} · ${body.phase}`),
    ).toBeVisible();
    await expect(
      page.getByText(`src: ${sourceGameId.slice(0, 8)}`),
    ).toBeVisible();
    await expect(page.locator('[data-testid="bottom-dashboard"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('can continue a loaded end-turn snapshot', async ({ page, request }) => {
    await waitForServerReady(request);
    const { gameId: sourceGameId } = await createReplaySourceDebugGame(
      request,
      {
        presetId: 'anomaly-discovery',
        checkpointId: 'before-end-turn',
        fieldValues: { alienType: '1' },
      },
    );

    await page.goto('/debug/replay');
    await expect(page.getByTestId('debug-replay-preset')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('debug-snapshot-game-id').fill(sourceGameId);

    const snapshotResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/debug/server/snapshot-session') &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('debug-snapshot-start').click();
    expect((await snapshotResponse).ok()).toBe(true);

    const endTurn = page.getByTestId('action-menu-end-turn');
    await expect(endTurn).toBeVisible({ timeout: 15_000 });
    await endTurn.click();

    await page.click(sel.boardTab('Aliens'));
    await expect(page.getByRole('heading', { name: /anomalies/i })).toBeVisible(
      {
        timeout: 15_000,
      },
    );
  });

  test('can continue a loaded main-action snapshot', async ({
    page,
    request,
  }) => {
    await waitForServerReady(request);
    const { gameId: sourceGameId } = await createReplaySourceDebugGame(
      request,
      {
        presetId: 'oumuamua-debug',
        checkpointId: 'trace-columns',
      },
    );

    await page.goto('/debug/replay');
    await expect(page.getByTestId('debug-replay-preset')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('debug-snapshot-game-id').fill(sourceGameId);

    const snapshotResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/debug/server/snapshot-session') &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('debug-snapshot-start').click();
    expect((await snapshotResponse).ok()).toBe(true);

    const launchProbe = page.getByTestId('action-menu-LAUNCH_PROBE');
    await expect(launchProbe).toBeEnabled({ timeout: 15_000 });

    await launchProbe.click();
    await expect(page.getByTestId('action-menu-end-turn')).toBeVisible({
      timeout: 15_000,
    });
  });
});
