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
    name: 'sector-1',
    color: ESector.RED,
    signals: [{ type: 'data' }, { type: 'data' }],
    dataCapability: 2,
    dataSlotCapacity: 2,
    firstWinnerBonus: [],
    otherWinnerBonus: [],
    sectorWinners: [],
    completed: false,
    ...overrides,
  };
}

describe('sector rules', () => {
  it('canPlaceSignal returns true while data signals remain', () => {
    const sector = createSectorState();
    expect(canPlaceSignal(sector)).toBe(true);
  });

  it('canPlaceSignal returns false when no data signals remain', () => {
    const sector = createSectorState({
      signals: [
        { type: 'player', playerId: 'p1' },
        { type: 'player', playerId: 'p2' },
      ],
    });
    expect(canPlaceSignal(sector)).toBe(false);
  });

  it('getSectorProgress returns filled (player) and total (capacity)', () => {
    const sector = createSectorState({
      signals: [
        { type: 'data' },
        { type: 'player', playerId: 'p1' },
        { type: 'player', playerId: 'p2' },
      ],
      dataSlotCapacity: 3,
    });
    expect(getSectorProgress(sector)).toEqual({ filled: 2, total: 3 });
  });

  it('isSectorComplete returns true when all signals are player markers', () => {
    const sector = createSectorState({
      signals: [
        { type: 'player', playerId: 'p1' },
        { type: 'player', playerId: 'p2' },
      ],
      completed: true,
    });
    expect(isSectorComplete(sector)).toBe(true);
    expect(canPlaceSignal(sector)).toBe(false);
  });

  it('isSectorComplete returns false for empty signals', () => {
    const sector = createSectorState({ signals: [] });
    expect(isSectorComplete(sector)).toBe(false);
  });

  it('getSectorStandings aggregates marker counts by player', () => {
    const sector = createSectorState({
      signals: [
        { type: 'player', playerId: 'player-a' },
        { type: 'player', playerId: 'player-b' },
        { type: 'player', playerId: 'player-a' },
      ],
    });

    expect(getSectorStandings(sector)).toEqual([
      { playerId: 'player-a', markerCount: 2 },
      { playerId: 'player-b', markerCount: 1 },
    ]);
  });
});
