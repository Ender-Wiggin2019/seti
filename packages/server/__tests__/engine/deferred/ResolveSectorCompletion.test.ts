import { ESector } from '@seti/common/types/element';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { Sector } from '@/engine/board/Sector.js';
import { ResolveSectorCompletion } from '@/engine/deferred/ResolveSectorCompletion.js';
import { Player } from '@/engine/player/Player.js';
import { buildTestGame, getPlayer } from '../../helpers/TestGameBuilder.js';

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

    // L→R fill: mark p2 first, then p1 so p1 is the "later placed"
    // marker and wins the tiebreak deterministically.
    sector.markSignal('p2');
    sector.markSignal('p1');

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

  // 5.2 Integration smoke — verify ResolveSectorCompletion runs against a
  // real Game object (built via TestGameBuilder) and drains through the
  // real DeferredActionsQueue, not an ad-hoc stub.
  it('integration: resolves a pre-fulfilled sector when drained through the real game queue', () => {
    const game = buildTestGame({ seed: 'resolve-sector-integration' });
    const p1 = getPlayer(game, 'p1');
    const p2 = getPlayer(game, 'p2');

    const sector = game.sectors[0];
    // Fill every slot with p1 markers so the sector is fulfilled.
    for (let i = 0; i < sector.dataSlotCapacity; i += 1) {
      sector.markSignal(p1.id);
    }
    // Give p2 a single trailing marker so tie-break + 2nd-place
    // placement after reset is observable against a real player.
    sector.markSignal(p2.id);
    expect(sector.isFulfilled()).toBe(true);
    expect(sector.completed).toBe(true);

    const pubBefore = p1.resources.publicity;
    game.deferredActions.push(new ResolveSectorCompletion(p1));
    const pending = game.deferredActions.drain(game);

    expect(pending).toBeDefined();
    if (!pending) {
      throw new Error('Expected trace placement input');
    }
    expect(pending.toModel().type).toBe(EPlayerInputType.OPTION);

    const model = pending.toModel() as ISelectOptionInputModel;
    const done = pending.process({
      type: EPlayerInputType.OPTION,
      optionId: model.options[0].id,
    });

    expect(done).toBeUndefined();
    expect(sector.sectorWinners).toEqual([p1.id]);
    expect(sector.completed).toBe(false);
    expect(sector.signals[0]).toEqual({ type: 'player', playerId: p2.id });
    expect(p1.resources.publicity).toBeGreaterThanOrEqual(pubBefore + 1);
  });
});
