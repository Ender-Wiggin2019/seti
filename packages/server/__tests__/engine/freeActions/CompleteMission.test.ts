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

const mockGame = {} as unknown as IGame;

describe('CompleteMissionFreeAction', () => {
  it('canExecute always returns false (pending implementation)', () => {
    const player = createTestPlayer();
    expect(CompleteMissionFreeAction.canExecute(player, mockGame)).toBe(false);
  });

  it('execute throws not implemented error', () => {
    const player = createTestPlayer();
    expect(() =>
      CompleteMissionFreeAction.execute(player, mockGame, 'card-1'),
    ).toThrow('not yet implemented');
  });
});
