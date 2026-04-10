import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import { AlienBoard } from '@/engine/alien/AlienBoard.js';

describe('AlienBoard', () => {
  it('initializes slots with defaults and queries discovery state', () => {
    const board = new AlienBoard({
      alienType: EAlienType.DUMMY,
      alienIndex: 0,
      slots: [
        {
          slotId: 'd1',
          alienIndex: 0,
          traceColor: ETrace.RED,
          isDiscovery: true,
        },
      ],
    });

    expect(board.getSlot('d1')).toBeDefined();
    expect(board.getDiscoverySlots()).toHaveLength(1);
    expect(board.getFirstEmptyDiscoverySlot()?.slotId).toBe('d1');
    expect(board.isFullyMarked()).toBe(false);
  });

  it('filters available slots by color and capacity', () => {
    const board = new AlienBoard({
      alienType: EAlienType.DUMMY,
      alienIndex: 1,
      slots: [
        {
          slotId: 'full',
          alienIndex: 1,
          traceColor: ETrace.RED,
          maxOccupants: 1,
          occupants: [{ source: { playerId: 'p1' }, traceColor: ETrace.RED }],
        },
        {
          slotId: 'open',
          alienIndex: 1,
          traceColor: ETrace.RED,
          maxOccupants: 2,
        },
        {
          slotId: 'any',
          alienIndex: 1,
          traceColor: ETrace.ANY,
        },
      ],
    });

    const ids = board
      .getAvailableSlots(ETrace.RED)
      .map((slot) => slot.slotId)
      .sort();

    expect(ids).toEqual(['any', 'open']);
  });

  it('places traces and tracks discoverers/counts', () => {
    const board = new AlienBoard({
      alienType: EAlienType.DUMMY,
      alienIndex: 2,
      slots: [
        {
          slotId: 'd1',
          alienIndex: 2,
          traceColor: ETrace.BLUE,
          isDiscovery: true,
          maxOccupants: 1,
        },
      ],
    });

    const slot = board.getSlot('d1');
    expect(slot).toBeDefined();
    if (!slot) return;

    expect(board.placeTrace(slot, { playerId: 'p1' }, ETrace.BLUE)).toBe(true);
    expect(board.placeTrace(slot, { playerId: 'p2' }, ETrace.BLUE)).toBe(false);
    expect(board.isFullyMarked()).toBe(true);

    board.addSlot({
      slotId: 'n1',
      alienIndex: 2,
      traceColor: ETrace.YELLOW,
      occupants: [{ source: 'neutral', traceColor: ETrace.YELLOW }],
      maxOccupants: -1,
    });

    expect(board.getDiscoverers()).toEqual(['p1']);
    expect(board.getPlayerTraceCount('p1')).toBe(1);
    expect(board.getPlayerTraceCountByColor('p1', ETrace.BLUE)).toBe(1);
  });
});
