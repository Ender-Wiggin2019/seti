import { ESector } from '@seti/common/types/element';
import { Sector } from '@/engine/board/Sector.js';
import { ResolveSectorCompletion } from '@/engine/deferred/ResolveSectorCompletion.js';
import { Player } from '@/engine/player/Player.js';

describe('ResolveSectorCompletion', () => {
  it('resolves completed sectors via SectorFulfillmentEffect', () => {
    const p1 = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    });
    const p2 = new Player({
      id: 'p2',
      name: 'Bob',
      color: 'blue',
      seatIndex: 1,
    });
    const sector = new Sector({
      id: 's1',
      color: ESector.RED,
      dataSlotCapacity: 2,
    });

    sector.markSignal('p1');
    sector.markSignal('p2');

    expect(sector.isFulfilled()).toBe(true);

    const game = {
      players: [p1, p2],
      sectors: [sector],
      eventLog: { append: () => undefined },
    } as never;

    const action = new ResolveSectorCompletion(p1);
    action.execute(game);

    expect(sector.sectorWinners).toHaveLength(1);
    expect(sector.sectorWinners[0]).toBe('p1');
    expect(p1.publicity).toBe(5);
    expect(p2.publicity).toBe(5);
  });
});
