import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canPlaceSignal,
  getSectorProgress,
  getSectorStandings,
  isSectorComplete,
} from '@seti/common/rules/sector';
import { ESector } from '@seti/common/types/element';
import type { IPublicSectorState } from '@seti/common/types/protocol/gameState';

function createSectorState(
  overrides?: Partial<IPublicSectorState>,
): IPublicSectorState {
  return {
    sectorId: 'sector-1',
    color: ESector.RED,
    dataSlots: ['data-1', 'data-2'],
    markerSlots: [],
    completed: false,
    ...overrides,
  };
}

describe('sector rules', () => {
  it('canPlaceSignal returns true while data remains', () => {
    const sector = createSectorState();
    assert.equal(canPlaceSignal(sector), true);
  });

  it('getSectorProgress returns filled and total slots', () => {
    const sector = createSectorState({
      dataSlots: ['data-2', null, null],
    });
    assert.deepEqual(getSectorProgress(sector), { filled: 2, total: 3 });
  });

  it('isSectorComplete returns true when all slots are null', () => {
    const sector = createSectorState({
      dataSlots: [null, null],
      completed: true,
    });
    assert.equal(isSectorComplete(sector), true);
    assert.equal(canPlaceSignal(sector), false);
  });

  it('getSectorStandings aggregates marker counts by player', () => {
    const sector = createSectorState({
      markerSlots: [
        { playerId: 'player-a', timestamp: 1 },
        { playerId: 'player-b', timestamp: 2 },
        { playerId: 'player-a', timestamp: 3 },
      ],
    });

    assert.deepEqual(getSectorStandings(sector), [
      { playerId: 'player-a', markerCount: 2 },
      { playerId: 'player-b', markerCount: 1 },
    ]);
  });
});
