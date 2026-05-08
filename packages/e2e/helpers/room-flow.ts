import { expect, type Page, type Response, type Route } from '@playwright/test';
import { resolveCardPromptIfVisible } from './prompt-resolvers';

export interface IRoomCreateResult {
  id: string;
  options?: {
    playerCount?: number;
    isSoloMode?: boolean;
    soloDifficulty?: number;
    alienModulesEnabled?: boolean[];
    undoAllowed?: boolean;
    timerPerTurn?: number;
  };
}

export interface ICreateRoomByUiOptions {
  alienTypes?: readonly ECoreAlienType[];
  isSoloMode?: boolean;
  soloDifficulty?: 1 | 2 | 3 | 4 | 5;
  seed?: string;
}

export enum ECoreAlienType {
  ANOMALIES = 1,
  CENTAURIANS = 2,
  EXERTIANS = 3,
  MASCAMITES = 4,
  OUMUAMUA = 5,
}

const CORE_ALIEN_TYPES = [
  ECoreAlienType.ANOMALIES,
  ECoreAlienType.CENTAURIANS,
  ECoreAlienType.EXERTIANS,
  ECoreAlienType.MASCAMITES,
  ECoreAlienType.OUMUAMUA,
] as const;

export async function createRoomByUi(
  page: Page,
  roomName: string,
  playerCount: 2 | 3 | 4,
  options: ICreateRoomByUiOptions = {},
): Promise<string> {
  const result = await createRoomByUiWithDetails(
    page,
    roomName,
    playerCount,
    options,
  );
  return result.id;
}

export async function createRoomByUiWithDetails(
  page: Page,
  roomName: string,
  playerCount: 2 | 3 | 4,
  options: ICreateRoomByUiOptions = {},
): Promise<IRoomCreateResult> {
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

  if (options.isSoloMode) {
    const soloToggle = page.locator('#solo-mode-toggle');
    await expect(soloToggle).toBeVisible({ timeout: 10_000 });
    const checked =
      (await soloToggle.getAttribute('aria-checked', {
        timeout: 10_000,
      })) === 'true';
    if (!checked) {
      await soloToggle.click();
      await expect(soloToggle).toHaveAttribute('aria-checked', 'true');
    }

    const difficulty = options.soloDifficulty ?? 1;
    const difficultyButton = page
      .locator('#solo-difficulty')
      .getByRole('button', { name: String(difficulty), exact: true });
    await expect(difficultyButton).toBeVisible({ timeout: 10_000 });
    await difficultyButton.click();
    await expect(difficultyButton).toHaveAttribute('aria-pressed', 'true');
  }

  if (options.alienTypes) {
    await selectAlienPoolByUi(page, options.alienTypes);
  }

  const routePattern = '**/lobby/rooms';
  const needsRoomCreateOverride = options.seed !== undefined;
  const roomCreateRoute = async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const body = JSON.parse(route.request().postData() ?? '{}') as {
      seed?: string;
    };
    await route.continue({
      postData: JSON.stringify({
        ...body,
        seed: options.seed ?? body.seed,
      }),
    });
  };

  if (needsRoomCreateOverride) {
    await page.route(routePattern, roomCreateRoute);
  }

  const response = await (async (): Promise<Response> => {
    try {
      const responsePromise = page.waitForResponse(
        (res) =>
          res.url().includes('/lobby/rooms') &&
          res.request().method() === 'POST',
        { timeout: 15_000 },
      );
      const dialog = page.getByTestId('create-room-dialog');
      await dialog.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      const submitButton = page.getByTestId('create-room-submit');
      await submitButton.scrollIntoViewIfNeeded();
      await submitButton.click();
      return await responsePromise;
    } finally {
      if (needsRoomCreateOverride) {
        await page.unroute(routePattern, roomCreateRoute);
      }
    }
  })();
  expect(response.ok()).toBe(true);

  const body = (await response.json()) as { id?: string };
  expect(body.id).toBeTruthy();
  await page.waitForURL(new RegExp(`/room/${body.id as string}$`), {
    timeout: 15_000,
  });
  await expect(page.getByTestId('game-setting-value-players')).toBeVisible({
    timeout: 15_000,
  });
  return body as IRoomCreateResult;
}

async function selectAlienPoolByUi(
  page: Page,
  alienTypes: readonly ECoreAlienType[],
): Promise<void> {
  const requested = new Set(alienTypes);
  expect(requested.size).toBeGreaterThanOrEqual(2);

  for (const alienType of CORE_ALIEN_TYPES) {
    if (!requested.has(alienType)) continue;

    const toggle = page.locator(`#alien-type-${alienType}`);
    await expect(toggle).toBeVisible({ timeout: 10_000 });

    const checked =
      (await toggle.getAttribute('aria-checked', { timeout: 10_000 })) ===
      'true';
    if (!checked) {
      await expect(toggle).toBeEnabled({ timeout: 10_000 });
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
    }
  }

  for (const alienType of CORE_ALIEN_TYPES) {
    const shouldBeEnabled = requested.has(alienType);
    if (shouldBeEnabled) continue;

    const toggle = page.locator(`#alien-type-${alienType}`);
    await expect(toggle).toBeVisible({ timeout: 10_000 });

    const checked =
      (await toggle.getAttribute('aria-checked', { timeout: 10_000 })) ===
      'true';

    if (checked) {
      await expect(toggle).toBeEnabled({ timeout: 10_000 });
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', 'false');
    }
  }
}

export async function joinRoomByUi(page: Page, roomId: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  let joinBtn = page.getByTestId('room-join');

  while (Date.now() < deadline) {
    await page.goto(`/room/${roomId}`);
    joinBtn = page.getByTestId('room-join');
    const isVisible = await joinBtn.isVisible().catch(() => false);
    if (isVisible) {
      break;
    }
    await page.waitForTimeout(1_000);
  }

  await expect(joinBtn).toBeVisible({ timeout: 1_000 });

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
  const deadline = Date.now() + 20_000;
  let launchBtn = page.getByTestId('room-launch-game');

  while (Date.now() < deadline) {
    await page.goto(`/room/${roomId}`);
    launchBtn = page.getByTestId('room-launch-game');
    const isVisible = await launchBtn.isVisible().catch(() => false);
    if (isVisible) {
      break;
    }
    await page.waitForTimeout(1_000);
  }

  await expect(launchBtn).toBeVisible({ timeout: 1_000 });

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
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    await page.goto(`/room/${roomId}`);

    const currentUrl = page.url();
    if (/\/game\/[^/?#]+$/.test(currentUrl)) {
      const gameId = currentUrl.split('/game/')[1]?.split(/[?#]/)[0];
      expect(gameId).toBeTruthy();
      await resolveCardPromptIfVisible(page);
      return gameId as string;
    }

    const enterBtn = page.getByTestId('room-enter-game');
    const isVisible = await enterBtn.isVisible().catch(() => false);
    if (isVisible) {
      await enterBtn.click();
      await page.waitForURL(/\/game\/[^/?#]+$/, { timeout: 15_000 });
      await resolveCardPromptIfVisible(page);
      const gameId = page.url().split('/game/')[1]?.split(/[?#]/)[0];
      expect(gameId).toBeTruthy();
      return gameId as string;
    }

    await page.waitForTimeout(1_000);
  }

  await expect(page.getByTestId('room-enter-game')).toBeVisible({
    timeout: 1_000,
  });

  await resolveCardPromptIfVisible(page);
  const gameId = page.url().split('/game/')[1]?.split(/[?#]/)[0];
  expect(gameId).toBeTruthy();
  return gameId as string;
}
