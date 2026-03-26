import { describe, expect, it } from 'vitest';
import {
  canPlaceSignal,
  getSectorProgress,
  getSectorStandings,
  isSectorComplete,
} from '@/rules/sector';
import { ESector } from '@/types/element';
import type { IPublicSectorState } from '@/types/protocol/gameState';

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
    expect(canPlaceSignal(sector)).toBe(true);
  });

  it('getSectorProgress returns filled and total slots', () => {
    const sector = createSectorState({
      dataSlots: ['data-2', null, null],
    });
    expect(getSectorProgress(sector)).toEqual({ filled: 2, total: 3 });
  });

  it('isSectorComplete returns true when all slots are null', () => {
    const sector = createSectorState({
      dataSlots: [null, null],
      completed: true,
    });
    expect(isSectorComplete(sector)).toBe(true);
    expect(canPlaceSignal(sector)).toBe(false);
  });

  it('getSectorStandings aggregates marker counts by player', () => {
    const sector = createSectorState({
      markerSlots: [
        { playerId: 'player-a', timestamp: 1 },
        { playerId: 'player-b', timestamp: 2 },
        { playerId: 'player-a', timestamp: 3 },
      ],
    });

    expect(getSectorStandings(sector)).toEqual([
      { playerId: 'player-a', markerCount: 2 },
      { playerId: 'player-b', markerCount: 1 },
    ]);
  });
});
