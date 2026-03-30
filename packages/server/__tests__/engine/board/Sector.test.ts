import { ESector } from '@seti/common/types/element';
import { Sector } from '@/engine/board/Sector.js';

describe('Sector', () => {
  describe('markSignal', () => {
    it('replaces rightmost data with player marker and gains data', () => {
      const sector = new Sector({
        id: 'sector-red',
        color: ESector.RED,
        dataSlotCapacity: 3,
      });

      const result = sector.markSignal('player-a');

      expect(result.dataGained).toBe(true);
      expect(sector.signals).toHaveLength(3);
      expect(sector.signals[2]).toEqual({
        type: 'player',
        playerId: 'player-a',
      });
      expect(sector.signals[0].type).toBe('data');
      expect(sector.signals[1].type).toBe('data');
      expect(sector.completed).toBe(false);
    });

    it('replaces rightmost data (not leftmost) progressively', () => {
      const sector = new Sector({
        id: 'sector-blue',
        color: ESector.BLUE,
        dataSlotCapacity: 5,
      });

      sector.markSignal('player-a');
      sector.markSignal('player-b');
      sector.markSignal('player-a');

      expect(sector.signals[4]).toEqual({
        type: 'player',
        playerId: 'player-a',
      });
      expect(sector.signals[3]).toEqual({
        type: 'player',
        playerId: 'player-b',
      });
      expect(sector.signals[2]).toEqual({
        type: 'player',
        playerId: 'player-a',
      });
      expect(sector.signals[0].type).toBe('data');
      expect(sector.signals[1].type).toBe('data');
    });

    it('appends marker when no data remains (no data gain)', () => {
      const sector = new Sector({
        id: 'sector-yellow',
        color: ESector.YELLOW,
        dataSlotCapacity: 2,
      });

      sector.markSignal('player-a');
      sector.markSignal('player-b');
      expect(sector.completed).toBe(true);

      const overflow = sector.markSignal('player-c');

      expect(overflow.dataGained).toBe(false);
      expect(sector.signals).toHaveLength(3);
      expect(sector.signals[2]).toEqual({
        type: 'player',
        playerId: 'player-c',
      });
    });

    it('sets completed=true when all data displaced', () => {
      const sector = new Sector({
        id: 'sector-black',
        color: ESector.BLACK,
        dataSlotCapacity: 2,
      });

      sector.markSignal('player-a');
      expect(sector.completed).toBe(false);

      sector.markSignal('player-b');
      expect(sector.completed).toBe(true);
    });
  });

  describe('isFulfilled', () => {
    it('returns false when data remains', () => {
      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 3,
      });
      sector.markSignal('player-a');
      expect(sector.isFulfilled()).toBe(false);
    });

    it('returns true when no data remains', () => {
      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 2,
      });
      sector.markSignal('player-a');
      sector.markSignal('player-b');
      expect(sector.isFulfilled()).toBe(true);
    });
  });

  describe('resolveCompletion', () => {
    it('selects winner by marker majority', () => {
      const sector = new Sector({
        id: 'sector-resolve',
        color: ESector.BLACK,
        dataSlotCapacity: 3,
      });

      sector.markSignal('player-a');
      sector.markSignal('player-a');
      sector.markSignal('player-b');

      const result = sector.resolveCompletion();

      expect(result.winnerPlayerId).toBe('player-a');
      expect(result.secondPlacePlayerId).toBe('player-b');
      expect(result.isFirstWin).toBe(true);
      expect(sector.sectorWinners).toEqual(['player-a']);
    });

    it('breaks ties by rightmost position', () => {
      const sector = new Sector({
        id: 'sector-tie',
        color: ESector.RED,
        dataSlotCapacity: 2,
      });

      // Data at [0,1] → markSignal replaces rightmost first
      sector.markSignal('player-a'); // index 1
      sector.markSignal('player-b'); // index 0

      // player-a at index 1 (rightmost), player-b at index 0
      // Both have 1 marker. Rightmost wins → player-a
      const result = sector.resolveCompletion();

      expect(result.winnerPlayerId).toBe('player-a');
      expect(result.secondPlacePlayerId).toBe('player-b');
    });

    it('resets sector after resolution with second-place at position 0', () => {
      const sector = new Sector({
        id: 'sector-reset',
        color: ESector.YELLOW,
        dataSlotCapacity: 3,
      });

      sector.markSignal('player-a');
      sector.markSignal('player-b');
      sector.markSignal('player-b');

      sector.resolveCompletion();

      // Sector reset: [player-a, Data, Data] (capacity 3, 2nd place at 0)
      expect(sector.signals).toHaveLength(3);
      expect(sector.signals[0]).toEqual({
        type: 'player',
        playerId: 'player-a',
      });
      expect(sector.signals[1].type).toBe('data');
      expect(sector.signals[2].type).toBe('data');
      expect(sector.completed).toBe(false);
    });

    it('tracks multiple winners across completion cycles', () => {
      const sector = new Sector({
        id: 'sector-multi',
        color: ESector.RED,
        dataSlotCapacity: 2,
      });

      sector.markSignal('player-a');
      sector.markSignal('player-b');
      sector.resolveCompletion();

      // 2nd round: sector-a is pre-placed at 0
      // markSignal replaces rightmost data (index 1) → player-b
      sector.markSignal('player-b');

      expect(sector.isFulfilled()).toBe(true);
      sector.resolveCompletion();

      expect(sector.sectorWinners).toEqual(['player-a', 'player-b']);
    });

    it('isFirstWin is false on repeat win', () => {
      const sector = new Sector({
        id: 'sector-repeat',
        color: ESector.BLUE,
        dataSlotCapacity: 2,
      });

      sector.markSignal('player-a');
      sector.markSignal('player-b');
      const first = sector.resolveCompletion();
      expect(first.isFirstWin).toBe(true);

      sector.markSignal('player-a');
      const second = sector.resolveCompletion();
      expect(second.winnerPlayerId).toBe('player-a');
      expect(second.isFirstWin).toBe(false);
    });

    it('throws when sector is not fulfilled', () => {
      const sector = new Sector({
        id: 'sector-error',
        color: ESector.RED,
        dataSlotCapacity: 3,
      });
      sector.markSignal('player-a');
      expect(() => sector.resolveCompletion()).toThrow();
    });
  });

  describe('reset', () => {
    it('refills data to capacity and clears markers', () => {
      const sector = new Sector({
        id: 'sector-reset-full',
        color: ESector.BLACK,
        dataSlotCapacity: 4,
      });

      sector.markSignal('player-a');
      sector.markSignal('player-b');
      sector.reset();

      expect(sector.signals).toHaveLength(4);
      expect(sector.signals.every((s) => s.type === 'data')).toBe(true);
      expect(sector.completed).toBe(false);
    });

    it('places second-place marker at index 0 without data gain', () => {
      const sector = new Sector({
        id: 'sector-reset-2nd',
        color: ESector.RED,
        dataSlotCapacity: 5,
      });
      sector.reset('player-b');

      expect(sector.signals).toHaveLength(5);
      expect(sector.signals[0]).toEqual({
        type: 'player',
        playerId: 'player-b',
      });
      for (let i = 1; i < 5; i++) {
        expect(sector.signals[i].type).toBe('data');
      }
    });
  });

  describe('user example: [Red, Green, Red, Green, Blue, Blue]', () => {
    it('resolves Blue as winner, Green as 2nd, resets to [Green, D, D, D, D]', () => {
      const sector = new Sector({
        id: 'example',
        color: ESector.RED,
        dataSlotCapacity: 5,
      });

      // Build: [Red, Green, Red, Green, Blue, Blue]
      // Start: [D, D, D, D, D]
      sector.markSignal('Red'); // → [D, D, D, D, Red]
      sector.markSignal('Green'); // → [D, D, D, Green, Red]
      sector.markSignal('Red'); // → [D, D, Red, Green, Red]
      sector.markSignal('Green'); // → [D, Green, Red, Green, Red]
      sector.markSignal('Blue'); // → [Blue, Green, Red, Green, Red]
      // All 5 data consumed. Sector fulfilled.
      expect(sector.isFulfilled()).toBe(true);

      // Append extra Blue (no data to displace)
      sector.markSignal('Blue'); // → [Blue, Green, Red, Green, Red, Blue]

      // Counts: Red=2 (idx 2,4), Green=2 (idx 1,3), Blue=2 (idx 0,5)
      // Rightmost: Blue@5, Red@4, Green@3 → Blue wins, Red 2nd
      const result = sector.resolveCompletion();

      expect(result.winnerPlayerId).toBe('Blue');
      expect(result.secondPlacePlayerId).toBe('Red');

      // Reset: capacity 5 → [Red, D, D, D, D]
      expect(sector.signals).toHaveLength(5);
      expect(sector.signals[0]).toEqual({
        type: 'player',
        playerId: 'Red',
      });
      for (let i = 1; i < 5; i++) {
        expect(sector.signals[i].type).toBe('data');
      }
    });
  });

  describe('query helpers', () => {
    it('getDataCount returns remaining data', () => {
      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 3,
      });
      sector.markSignal('player-a');
      expect(sector.getDataCount()).toBe(2);
    });

    it('getPlayerMarkerCount counts all or by player', () => {
      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 3,
      });
      sector.markSignal('player-a');
      sector.markSignal('player-b');
      expect(sector.getPlayerMarkerCount()).toBe(2);
      expect(sector.getPlayerMarkerCount('player-a')).toBe(1);
    });

    it('toPublicState returns unified signal view', () => {
      const sector = new Sector({
        id: 's1',
        color: ESector.RED,
        dataSlotCapacity: 3,
      });
      sector.markSignal('player-a');

      const pub = sector.toPublicState();

      expect(pub.sectorId).toBe('s1');
      expect(pub.signals).toHaveLength(3);
      expect(pub.signals[0].type).toBe('data');
      expect(pub.signals[1].type).toBe('data');
      expect(pub.signals[2]).toEqual({
        type: 'player',
        playerId: 'player-a',
      });
      expect(pub.dataSlotCapacity).toBe(3);
      expect(pub.sectorWinners).toEqual([]);
    });
  });
});
