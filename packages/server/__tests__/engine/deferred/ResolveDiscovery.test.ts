import { ResolveDiscovery } from '@/engine/deferred/ResolveDiscovery.js';
import { Player } from '@/engine/player/Player.js';
import { MilestoneState } from '@/engine/scoring/Milestone.js';

describe('ResolveDiscovery', () => {
  it('is a no-op framework action before Stage 8', () => {
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    });
    const game = {
      players: [player],
      milestoneState: new MilestoneState([20]),
      eventLog: { append: () => undefined },
    } as never;

    const action = new ResolveDiscovery(player);
    expect(action.execute(game)).toBeUndefined();
  });
});
