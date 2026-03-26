import { CompleteMissionFreeAction } from '@/engine/freeActions/CompleteMission.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createTestPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
  });
}

function createMockGame(
  overrides: Partial<IGame['missionTracker']> = {},
): IGame {
  return {
    missionTracker: {
      hasCompletableQuickMissions: () => false,
      getCompletableQuickMissions: () => [],
      completeMissionBranch: () => undefined,
      ...overrides,
    },
  } as unknown as IGame;
}

describe('CompleteMissionFreeAction', () => {
  it('returns mission tracker availability from canExecute', () => {
    const player = createTestPlayer();
    const mockGame = createMockGame({
      hasCompletableQuickMissions: () => true,
    });

    expect(CompleteMissionFreeAction.canExecute(player, mockGame)).toBe(true);
  });

  it('throws for non-completable mission branch', () => {
    const player = createTestPlayer();
    const mockGame = createMockGame();

    expect(() =>
      CompleteMissionFreeAction.execute(player, mockGame, 'card-1'),
    ).toThrow('is not completable');
  });
});
