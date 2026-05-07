import {
  type Browser,
  type BrowserContext,
  expect,
  type Page,
} from '@playwright/test';
import { createUser, type IUserCred, registerByUi } from './auth-flow';
import {
  createRoomByUi,
  enterGameByUi,
  type ICreateRoomByUiOptions,
  joinRoomByUi,
  launchGameByUi,
} from './room-flow';
import { sel } from './selectors';

export interface IUserSession {
  context: BrowserContext;
  page: Page;
  user: IUserCred;
}

export interface ICreateStartedGameByUiOptions {
  playerCount?: 2 | 3 | 4;
  roomName?: string;
  userPrefix?: string;
  roomOptions?: ICreateRoomByUiOptions;
}

export interface IStartedGameByUiResult {
  roomId: string;
  gameId: string;
  sessions: IUserSession[];
  host: IUserSession;
  guests: IUserSession[];
  pages: Page[];
  contexts: BrowserContext[];
  close: () => Promise<void>;
}

export async function openUserContext(
  browser: Browser,
  userPrefix = 'e2e-user',
): Promise<IUserSession> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return {
    context,
    page,
    user: createUser(userPrefix),
  };
}

export async function createStartedGameByUi(
  browser: Browser,
  options: ICreateStartedGameByUiOptions = {},
): Promise<IStartedGameByUiResult> {
  const playerCount = options.playerCount ?? 2;
  const userPrefix = options.userPrefix ?? 'started-game';
  const roomName =
    options.roomName ?? `Started Game Room ${Date.now().toString()}`;
  const sessions = await Promise.all(
    Array.from({ length: playerCount }, async (_, index) =>
      openUserContext(browser, `${userPrefix}-${index + 1}`),
    ),
  );
  const [host, ...guests] = sessions;

  try {
    await Promise.all(
      sessions.map((session) => registerByUi(session.page, session.user)),
    );

    const roomId = await createRoomByUi(
      host.page,
      roomName,
      playerCount,
      options.roomOptions,
    );

    for (const guest of guests) {
      await joinRoomByUi(guest.page, roomId);
    }

    const gameId = await launchGameByUi(host.page, roomId);
    const guestGameIds = await Promise.all(
      guests.map((guest) => enterGameByUi(guest.page, roomId)),
    );
    expect(guestGameIds.every((guestGameId) => guestGameId === gameId)).toBe(
      true,
    );

    await Promise.all(
      sessions.map((session) =>
        expect(session.page.locator(sel.bottomDashboard)).toBeVisible({
          timeout: 15_000,
        }),
      ),
    );

    return {
      roomId,
      gameId,
      sessions,
      host,
      guests,
      pages: sessions.map((session) => session.page),
      contexts: sessions.map((session) => session.context),
      close: async () => {
        await Promise.all(
          sessions.map((session) =>
            session.context.close().catch(() => undefined),
          ),
        );
      },
    };
  } catch (error) {
    await Promise.all(
      sessions.map((session) => session.context.close().catch(() => undefined)),
    );
    throw error;
  }
}
