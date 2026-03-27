import { AlienState } from '@/engine/alien/AlienState.js';
import { ResolveDiscovery } from '@/engine/deferred/ResolveDiscovery.js';
import { Player } from '@/engine/player/Player.js';

describe('ResolveDiscovery', () => {
  it('is a no-op when no aliens are fully marked', () => {
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    });
    const game = {
      players: [player],
      alienState: AlienState.createFromHiddenAliens([]),
      eventLog: { append: () => undefined },
    } as never;

    const action = new ResolveDiscovery(player);
    expect(action.execute(game)).toBeUndefined();
  });
});
