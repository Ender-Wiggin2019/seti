import { type Browser, expect, type Page, test } from '@playwright/test';
import { coordinateFromSpaceId } from '@seti/common/constant/solarCoordinate';
import { EOrganizationId } from '@seti/common/types/organization';
import {
  clickMainAction,
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  resolveCardPromptIfVisible,
  waitForActionOwner,
  waitForAndResolveCardPrompt,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const SENTINEL_EVENT_BUS_SEEDS = ['sa-event-bus-ui-2'] as const;

const SECTOR_SLOT_BY_INDEX = [
  { position: 'north', nodeIndex: 0 },
  { position: 'north', nodeIndex: 1 },
  { position: 'west', nodeIndex: 0 },
  { position: 'west', nodeIndex: 1 },
  { position: 'east', nodeIndex: 0 },
  { position: 'east', nodeIndex: 1 },
  { position: 'south', nodeIndex: 0 },
  { position: 'south', nodeIndex: 1 },
] as const;

async function clickRoomOptionSwitch(
  page: Page,
  roomId: string,
  switchId: string,
  checked: boolean,
): Promise<void> {
  const toggle = page.locator(`#${switchId}`);
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  await expect(toggle).toBeEnabled({ timeout: 10_000 });

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/lobby/rooms/${roomId}/options`) &&
      res.request().method() === 'PATCH',
    { timeout: 15_000 },
  );
  await toggle.click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  await expect(toggle).toHaveAttribute(
    'aria-checked',
    checked ? 'true' : 'false',
    { timeout: 10_000 },
  );
}

async function chooseFirstOrganization(page: Page): Promise<void> {
  await expect(
    page.locator('[data-testid^="input-option-"]').first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  const optionIds = await setupOptionIds(page);
  const preferredOptionId =
    optionIds.find(
      (optionId) => optionId !== EOrganizationId.ORBITAL_DYNAMICS,
    ) ?? optionIds[0];
  if (!preferredOptionId) {
    throw new Error('Expected at least one organization option');
  }
  const option = page.getByTestId(`input-option-${preferredOptionId}`);
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();
}

async function setupOptionIds(page: Page): Promise<string[]> {
  const options = page.locator('[data-testid^="input-option-"]');
  const count = await options.count();
  const ids: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const testId = await options.nth(index).getAttribute('data-testid');
    if (testId) {
      ids.push(testId.slice('input-option-'.length));
    }
  }
  return ids;
}

async function chooseSentinelIfAvailable(
  hostPage: Page,
  guestPage: Page,
): Promise<Page | undefined> {
  await expect(
    hostPage.locator('[data-testid^="input-option-"]').first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    guestPage.locator('[data-testid^="input-option-"]').first(),
  ).toBeVisible({
    timeout: 15_000,
  });

  const hostSentinelOption = hostPage.getByTestId(
    `input-option-${EOrganizationId.SENTINEL_PROBE_NETWORK}`,
  );
  const guestSentinelOption = guestPage.getByTestId(
    `input-option-${EOrganizationId.SENTINEL_PROBE_NETWORK}`,
  );

  const hostHasSentinel = await hostSentinelOption
    .isVisible()
    .catch(() => false);
  if (hostHasSentinel) {
    await hostSentinelOption.click();
    await chooseFirstOrganization(guestPage);
    return hostPage;
  }

  const guestHasSentinel = await guestSentinelOption
    .isVisible()
    .catch(() => false);
  if (guestHasSentinel) {
    await guestSentinelOption.click();
    await chooseFirstOrganization(hostPage);
    return guestPage;
  }

  return undefined;
}

async function resolveSetupPrompts(
  hostPage: Page,
  guestPage: Page,
): Promise<void> {
  for (let step = 0; step < 6; step += 1) {
    const hostResolved = await waitForAndResolveCardPrompt(hostPage, 5_000);
    const guestResolved = await waitForAndResolveCardPrompt(guestPage, 5_000);
    if (!hostResolved && !guestResolved) {
      return;
    }
  }
}

async function waitForLaunchTurn(
  hostPage: Page,
  guestPage: Page,
  sentinelPage: Page,
): Promise<void> {
  for (let passCount = 0; passCount < 4; passCount += 1) {
    const launchOwner = await waitForActionOwner(
      hostPage,
      guestPage,
      'LAUNCH_PROBE',
      20_000,
    );

    if (launchOwner.actor === sentinelPage) {
      return;
    }

    await clickMainAction(launchOwner.actor, 'PASS');
    await resolveCardPromptIfVisible(launchOwner.actor, 1_000);
    await resolveCardPromptIfVisible(launchOwner.other, 1_000);
  }

  throw new Error('Sentinel Probe Network owner did not receive a launch turn');
}

function sectorSignalSlotSelector(spaceId: string): string {
  const coordinate = coordinateFromSpaceId(spaceId);
  if (!coordinate) {
    throw new Error(
      `Cannot derive sector from launched probe space ${spaceId}`,
    );
  }
  const slot = SECTOR_SLOT_BY_INDEX[coordinate.sectorIndex];
  if (!slot) {
    throw new Error(
      `No sector slot mapping for sector ${coordinate.sectorIndex}`,
    );
  }
  return `[data-testid="sector-node-${slot.position}-${slot.nodeIndex}-slot-0"]`;
}

async function launchedProbeDetails(page: Page): Promise<{
  playerId: string;
  spaceId: string;
}> {
  const probe = page.locator('[data-testid^="solar-probe-"]').first();
  await expect(probe).toBeVisible({ timeout: 15_000 });
  const playerId = await probe.getAttribute('data-player-id');
  const spaceId = await probe.getAttribute('data-space-id');
  expect(playerId).toBeTruthy();
  expect(spaceId).toBeTruthy();
  return { playerId: playerId as string, spaceId: spaceId as string };
}

async function expectSignalMarkerInSector(
  page: Page,
  spaceId: string,
  playerId: string,
): Promise<void> {
  const marker = page.locator(sectorSignalSlotSelector(spaceId));
  await expect(marker).toHaveAttribute('data-signal-type', 'player', {
    timeout: 15_000,
  });
  await expect(marker).toHaveAttribute('data-player-id', playerId, {
    timeout: 10_000,
  });
}

async function runSentinelEventBusAttempt(
  browser: Browser,
  attempt: number,
  seed: string,
): Promise<boolean> {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser(`sa-event-bus-host-${attempt}`);
  const guest = createUser(`sa-event-bus-guest-${attempt}`);

  try {
    await registerByUi(hostPage, host);
    const roomId = await createRoomByUi(
      hostPage,
      `SA Event Bus ${Date.now()}`,
      2,
      { seed },
    );

    await clickRoomOptionSwitch(hostPage, roomId, 'space-agency-enabled', true);
    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      'space-agency-agencies',
      true,
    );

    await registerByUi(guestPage, guest);
    await joinRoomByUi(guestPage, roomId);

    const hostGameId = await launchGameByUi(hostPage, roomId);
    const guestGameId = await enterGameByUi(guestPage, roomId);
    expect(guestGameId).toBe(hostGameId);

    await expect(hostPage.getByTestId('setup-choice-shell')).toBeVisible({
      timeout: 15_000,
    });
    await expect(guestPage.getByTestId('setup-choice-shell')).toBeVisible({
      timeout: 15_000,
    });

    const sentinelPage = await chooseSentinelIfAvailable(hostPage, guestPage);
    if (sentinelPage === undefined) {
      const hostOptions = await setupOptionIds(hostPage);
      const guestOptions = await setupOptionIds(guestPage);
      throw new Error(
        `Sentinel Probe Network not in setup options for seed ${seed}; host=${hostOptions.join(',')}; guest=${guestOptions.join(',')}`,
      );
    }
    const observerPage = sentinelPage === hostPage ? guestPage : hostPage;

    await expect(sentinelPage.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await expect(observerPage.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      sentinelPage.getByTestId(
        `organization-badge-${EOrganizationId.SENTINEL_PROBE_NETWORK}`,
      ),
    ).toBeVisible({ timeout: 15_000 });

    await resolveSetupPrompts(hostPage, guestPage);
    await expect(
      sentinelPage.locator(
        '[data-testid^="sector-node-"][data-testid*="-slot-"][data-signal-type="player"]',
      ),
    ).toHaveCount(0);

    await waitForLaunchTurn(hostPage, guestPage, sentinelPage);
    await clickMainAction(sentinelPage, 'LAUNCH_PROBE');

    const { playerId, spaceId } = await launchedProbeDetails(sentinelPage);
    await expectSignalMarkerInSector(sentinelPage, spaceId, playerId);
    await expectSignalMarkerInSector(observerPage, spaceId, playerId);
    return true;
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
}

test('@real-ui Space Agency Sentinel event marks launched probe sector', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  for (
    let attempt = 0;
    attempt < SENTINEL_EVENT_BUS_SEEDS.length;
    attempt += 1
  ) {
    if (
      await runSentinelEventBusAttempt(
        browser,
        attempt,
        SENTINEL_EVENT_BUS_SEEDS[attempt],
      )
    ) {
      return;
    }
  }

  throw new Error(
    'Sentinel Probe Network did not appear for the deterministic setup seeds',
  );
});
