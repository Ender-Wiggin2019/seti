import { expect, type Page, type TestInfo, test } from '@playwright/test';
import { type IDebugGameState, SetiApi } from '../helpers/api';
import { injectAuth } from '../helpers/auth';
import { sel } from '../helpers/selectors';

function getCardId(card: { id: string } | string): string {
  return typeof card === 'string' ? card : card.id;
}

function getResources(resources: Record<string, number | undefined>) {
  return {
    credit: resources.credit ?? resources.credits ?? resources.CREDIT ?? 0,
    energy: resources.energy ?? resources.ENERGY ?? 0,
    publicity: resources.publicity ?? resources.PUBLICITY ?? 0,
  };
}

function getPlayer(state: IDebugGameState, playerId: string) {
  const player = state.players.find((p) => p.playerId === playerId);
  if (!player) {
    throw new Error(`Player ${playerId} not found`);
  }
  return player;
}

function findSpaceByElement(
  state: IDebugGameState,
  elementType: string,
): string {
  const entries = Object.entries(state.solarSystem.spaceStates ?? {});
  const matched = entries.find(([, space]) =>
    (space.elementTypes ?? []).includes(elementType),
  );
  if (!matched) {
    throw new Error(`No space contains element ${elementType}`);
  }
  return matched[0];
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

test('behavior flow e2e (api-driven): play -> launch -> move -> venus', async ({
  page,
  request,
}, testInfo) => {
  const api = new SetiApi(request);
  const session = await api.createBehaviorFlowSession();
  const aliceSession = session.players.find((p) => p.user.name === 'Alice');
  const bobSession = session.players.find((p) => p.user.name === 'Bob');

  if (!aliceSession || !bobSession) {
    throw new Error('Behavior-flow session missing Alice/Bob');
  }

  const gameId = session.gameId;
  const aliceId = aliceSession.user.id;
  const bobId = bobSession.user.id;

  let state = await api.debugGetState(gameId, aliceId);
  const alice = getPlayer(state, aliceId);
  const startHand = (alice.hand ?? []).map((card) => getCardId(card));
  expect(startHand).toEqual(['80', '16', '130', '110']);
  expect(getResources(alice.resources).credit).toBe(4);

  // 1) Play card 80
  const card80Index = startHand.indexOf('80');
  state = await api.debugMainAction(
    gameId,
    aliceId,
    {
      type: 'PLAY_CARD',
      payload: { cardIndex: card80Index },
    },
    aliceId,
  );

  // If Bob became active, pass Bob once to continue Alice flow.
  if (state.currentPlayerId === bobId) {
    state = await api.debugMainAction(gameId, bobId, { type: 'PASS' }, aliceId);

    for (let attempt = 0; attempt < 6 && state.currentPlayerId === bobId; attempt += 1) {
      const bob = getPlayer(state, bobId);
      const fallbackEorCard =
        (state as unknown as {
          endOfRoundStacks?: Array<Array<{ id: string } | string>>;
        }).endOfRoundStacks?.[0]?.[0];

      const candidates: Array<Record<string, unknown>> = [
        { type: 'OPTION', optionId: 'done' },
        { type: 'OPTION', optionId: 'skip-missions' },
      ];

      const firstBobHandCard = (bob.hand ?? [])[0];
      if (firstBobHandCard) {
        candidates.push({
          type: 'CARD',
          cardIds: [getCardId(firstBobHandCard)],
        });
      }
      if (fallbackEorCard) {
        candidates.push({
          type: 'END_OF_ROUND',
          cardId: getCardId(fallbackEorCard),
        });
      }

      let resolved = false;
      for (const input of candidates) {
        try {
          state = await api.debugInput(gameId, bobId, input, aliceId);
          resolved = true;
          break;
        } catch {
          // try next input shape
        }
      }

      if (!resolved) {
        break;
      }
    }
  }
  expect(state.currentPlayerId).toBe(aliceId);

  // 2) Launch probe + resolve deterministic mission inputs.
  state = await api.debugMainAction(
    gameId,
    aliceId,
    { type: 'LAUNCH_PROBE' },
    aliceId,
  );
  state = await api.debugInput(
    gameId,
    aliceId,
    { type: 'OPTION', optionId: 'complete-80-0' },
    aliceId,
  );
  state = await api.debugInput(
    gameId,
    aliceId,
    { type: 'OPTION', optionId: 'complete-80-1' },
    aliceId,
  );
  // Optional follow-up input in some branches.
  await api
    .debugInput(
      gameId,
      aliceId,
      { type: 'OPTION', optionId: 'skip-missions' },
      aliceId,
    )
    .then((next) => {
      state = next;
    })
    .catch(() => undefined);

  const earthSpaceId = findSpaceByElement(state, 'EARTH');
  const venusSpaceId = findSpaceByElement(state, 'VENUS');
  const asteroidSpaceId =
    (state.solarSystem.adjacency[earthSpaceId] ?? []).find((spaceId) =>
      (state.solarSystem.spaceStates?.[spaceId]?.elementTypes ?? []).includes(
        'ASTEROID',
      ),
    ) ?? earthSpaceId;

  // 3) Earth -> Asteroid -> Venus
  state = await api.debugFreeAction(
    gameId,
    aliceId,
    { type: 'MOVEMENT', path: [earthSpaceId, asteroidSpaceId] },
    aliceId,
  );
  state = await api.debugFreeAction(
    gameId,
    aliceId,
    { type: 'CONVERT_ENERGY_TO_MOVEMENT', amount: 1 },
    aliceId,
  );
  state = await api.debugFreeAction(
    gameId,
    aliceId,
    { type: 'MOVEMENT', path: [asteroidSpaceId, venusSpaceId] },
    aliceId,
  );

  // 4) Play card 16, land Venus, place yellow trace.
  const afterMove = getPlayer(state, aliceId);
  const card16Index = (afterMove.hand ?? []).findIndex(
    (card) => getCardId(card) === '16',
  );
  state = await api.debugMainAction(
    gameId,
    aliceId,
    { type: 'PLAY_CARD', payload: { cardIndex: card16Index } },
    aliceId,
  );
  state = await api.debugInput(
    gameId,
    aliceId,
    { type: 'OPTION', optionId: 'land-VENUS' },
    aliceId,
  );
  state = await api.debugInput(
    gameId,
    aliceId,
    { type: 'TRACE', trace: 'YELLOW' },
    aliceId,
  );
  state = await api.debugInput(
    gameId,
    aliceId,
    { type: 'OPTION', optionId: 'alien-0-discovery-YELLOW' },
    aliceId,
  );

  const afterLand = getPlayer(state, aliceId);
  expect(afterLand.probesInSpace).toBe(0);
  expect(getResources(afterLand.resources).publicity).toBeGreaterThanOrEqual(5);
  expect(
    state.planetaryBoard?.planets?.VENUS?.landingSlots?.some(
      (slot) => slot.playerId === aliceId,
    ),
  ).toBe(true);

  await injectAuth(page, aliceSession.accessToken, aliceSession.user);
  await page.goto(`/game/${gameId}`);
  await expect(page.locator(sel.bottomDashboard)).toBeVisible({
    timeout: 10_000,
  });
  await attachStepScreenshot(page, testInfo, 'behavior-flow-landed-venus');
});
