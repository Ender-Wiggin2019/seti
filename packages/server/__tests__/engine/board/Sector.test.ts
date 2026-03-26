import { ESector } from '@seti/common/types/element';
import { Sector } from '@/engine/board/Sector.js';

describe('Sector', () => {
  it('markSignal gains leftmost data and places marker', () => {
    const sector = new Sector({
      id: 'sector-red',
      color: ESector.RED,
      dataSlotCapacity: 2,
      winnerReward: 3,
    });

    const result = sector.markSignal('player-a');

    expect(result.dataGained).toBe('data-1');
    expect(result.vpGained).toBe(0);
    expect(sector.markerSlots).toHaveLength(1);
    expect(sector.markerSlots[0]?.playerId).toBe('player-a');
    expect(sector.dataSlots).toEqual(['data-2', null]);
    expect(sector.completed).toBe(false);
  });

  it('markSignal grants +2 VP when occupying second signal position', () => {
    const sector = new Sector({
      id: 'sector-blue',
      color: ESector.BLUE,
      dataSlotCapacity: 3,
    });

    sector.markSignal('player-a');
    const secondResult = sector.markSignal('player-b');

    expect(secondResult.vpGained).toBe(2);
    expect(secondResult.dataGained).toBe('data-2');
  });

  it('markSignal overflows when slots are full and still counts marker', () => {
    const sector = new Sector({
      id: 'sector-yellow',
      color: ESector.YELLOW,
      dataSlotCapacity: 1,
    });

    sector.markSignal('player-a');
    const overflowResult = sector.markSignal('player-b');

    expect(overflowResult.dataGained).toBeNull();
    expect(sector.overflowMarkers).toHaveLength(1);
    expect(sector.overflowMarkers[0]?.playerId).toBe('player-b');
  });

  it('resolveCompletion selects winner by marker majority', () => {
    const sector = new Sector({
      id: 'sector-black',
      color: ESector.BLACK,
      dataSlotCapacity: 3,
      winnerReward: 4,
    });

    sector.markSignal('player-a');
    sector.markSignal('player-a');
    sector.markSignal('player-b');

    const completion = sector.resolveCompletion();

    expect(completion.winnerPlayerId).toBe('player-a');
    expect(completion.secondPlacePlayerId).toBe('player-b');
    expect(completion.winnerReward).toBe(4);
    expect(sector.winnerMarkers).toHaveLength(1);
    expect(sector.winnerMarkers[0]).toEqual({
      playerId: 'player-a',
      reward: 4,
    });
  });

  it('resolveCompletion breaks ties by latest marker', () => {
    const sector = new Sector({
      id: 'sector-tie',
      color: ESector.RED,
      dataSlotCapacity: 2,
    });

    sector.markSignal('player-a');
    sector.markSignal('player-b');

    const completion = sector.resolveCompletion();

    expect(completion.winnerPlayerId).toBe('player-b');
    expect(completion.secondPlacePlayerId).toBe('player-a');
  });

  it('resolveCompletion grants +1 publicity to all contributors', () => {
    const sector = new Sector({
      id: 'sector-publicity',
      color: ESector.BLUE,
      dataSlotCapacity: 3,
    });

    sector.markSignal('player-a');
    sector.markSignal('player-b');
    sector.markSignal('player-a');

    const completion = sector.resolveCompletion();

    expect(completion.participants.sort()).toEqual(['player-a', 'player-b']);
    expect(completion.publicityGains).toEqual({
      'player-a': 1,
      'player-b': 1,
    });
  });

  it('resolveCompletion retains second place marker after reset', () => {
    const sector = new Sector({
      id: 'sector-retain',
      color: ESector.YELLOW,
      dataSlotCapacity: 3,
    });

    sector.markSignal('player-a');
    sector.markSignal('player-b');
    sector.markSignal('player-b');

    sector.resolveCompletion();

    expect(sector.markerSlots).toHaveLength(1);
    expect(sector.markerSlots[0]?.playerId).toBe('player-a');
    expect(sector.overflowMarkers).toHaveLength(0);
    expect(sector.completed).toBe(false);
  });

  it('reset refills data slots and clears temporary markers', () => {
    const sector = new Sector({
      id: 'sector-reset',
      color: ESector.BLACK,
      dataSlotCapacity: 2,
    });

    sector.markSignal('player-a');
    sector.markSignal('player-b');
    sector.resolveCompletion();
    sector.reset();

    expect(sector.dataSlots.every((dataToken) => dataToken !== null)).toBe(
      true,
    );
    expect(sector.markerSlots).toHaveLength(0);
    expect(sector.overflowMarkers).toHaveLength(0);
    expect(sector.completed).toBe(false);
  });

  it('supports full flow across multiple completion rounds', () => {
    const sector = new Sector({
      id: 'sector-flow',
      color: ESector.RED,
      dataSlotCapacity: 2,
      winnerReward: 5,
    });

    sector.markSignal('player-a');
    sector.markSignal('player-b');
    const firstCompletion = sector.resolveCompletion();

    expect(firstCompletion.winnerPlayerId).toBe('player-b');
    expect(sector.markerSlots).toHaveLength(1);
    expect(sector.markerSlots[0]?.playerId).toBe('player-a');

    const secondRoundMark = sector.markSignal('player-b');
    expect(secondRoundMark.vpGained).toBe(2);
    expect(sector.completed).toBe(true);

    const secondCompletion = sector.resolveCompletion();

    expect(secondCompletion.winnerPlayerId).toBe('player-b');
    expect(secondCompletion.secondPlacePlayerId).toBe('player-a');
    expect(sector.winnerMarkers).toHaveLength(2);
    expect(sector.winnerMarkers[1]).toEqual({
      playerId: 'player-b',
      reward: 5,
    });
  });
});
