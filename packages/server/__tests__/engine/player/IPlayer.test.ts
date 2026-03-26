import type { IPlayerIdentity } from '@/engine/player/IPlayer.js';

describe('IPlayer type contract', () => {
  it('preserves identity fields in typed shape', () => {
    const identity: IPlayerIdentity = {
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    };

    expect(identity.name).toBe('Alice');
  });
});
