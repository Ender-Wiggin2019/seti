import { ESector } from '@seti/common/types/element';
import { Sector } from '@/engine/board/Sector.js';

describe('Sector', () => {
  // Rule (rule-raw §Marking a Signal / rule-simple §5.4):
  //   "take the leftmost data token... replace it with a marker in your color"
  //   "Data is replaced by markers in order from left to right"
  //   "If you place it in a sector's second data slot, IMMEDIATELY score 2 VP"
  describe('markSignal fills left-to-right (rule 5.4)', () => {
    it('replaces the leftmost data token with the player marker', () => {
      const sector = new Sector({
        id: 'sector-ltr-1',
        color: ESector.RED,
        dataSlotCapacity: 3,
      });

      sector.markSignal('player-a');

      expect(sector.signals[0]).toEqual({
        type: 'player',
        playerId: 'player-a',
      });
      expect(sector.signals[1].type).toBe('data');
      expect(sector.signals[2].type).toBe('data');
    });

    it('progressively fills leftmost remaining data slot', () => {
      const sector = new Sector({
        id: 'sector-ltr-2',
        color: ESector.BLUE,
        dataSlotCapacity: 5,
      });

      sector.markSignal('player-a');
      sector.markSignal('player-b');
      sector.markSignal('player-a');

      expect(sector.signals[0]).toEqual({
        type: 'player',
        playerId: 'player-a',
      });
      expect(sector.signals[1]).toEqual({
        type: 'player',
        playerId: 'player-b',
      });
      expect(sector.signals[2]).toEqual({
        type: 'player',
        playerId: 'player-a',
      });
      expect(sector.signals[3].type).toBe('data');
      expect(sector.signals[4].type).toBe('data');
    });

    it('awards +2 VP when placing in the second slot (index 1), no VP elsewhere by default', () => {
      const sector = new Sector({
        id: 'sector-2nd-vp',
        color: ESector.BLACK,
        dataSlotCapacity: 4,
      });

      const first = sector.markSignal('p1');
      const second = sector.markSignal('p2');
      const third = sector.markSignal('p3');

      expect(first.vpAwarded).toBe(0); // slot 0 → 0 VP
      expect(second.vpAwarded).toBe(2); // slot 1 → +2 VP (fixed rule)
      expect(third.vpAwarded).toBe(0); // slot 2 → 0 VP
    });

    it('allows marking beyond capacity — extra markers append with no data gain', () => {
      const sector = new Sector({
        id: 'sector-overflow',
        color: ESector.YELLOW,
        dataSlotCapacity: 2,
      });

      const r1 = sector.markSignal('p1');
      const r2 = sector.markSignal('p2');
      expect(r1.dataGained).toBe(true);
      expect(r2.dataGained).toBe(true);
      expect(sector.isFulfilled()).toBe(true);

      const overflow1 = sector.markSignal('p3');
      const overflow2 = sector.markSignal('p1');

      expect(overflow1).toEqual({ dataGained: false, vpAwarded: 0 });
      expect(overflow2).toEqual({ dataGained: false, vpAwarded: 0 });
      expect(sector.signals).toHaveLength(4);
      expect(sector.signals[2]).toEqual({ type: 'player', playerId: 'p3' });
      expect(sector.signals[3]).toEqual({ type: 'player', playerId: 'p1' });
    });

    it('honors a custom positionRewards config', () => {
      const sector = new Sector({
        id: 'sector-config-rewards',
        color: ESector.RED,
        dataSlotCapacity: 3,
        positionRewards: [5, 0, 7],
      });

      expect(sector.markSignal('p1').vpAwarded).toBe(5);
      expect(sector.markSignal('p2').vpAwarded).toBe(0);
      expect(sector.markSignal('p3').vpAwarded).toBe(7);
    });
  });

  describe('markSignal', () => {
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
      expect(overflow.vpAwarded).toBe(0);
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

    it('breaks ties by rightmost position (later-placed wins)', () => {
      const sector = new Sector({
        id: 'sector-tie',
        color: ESector.RED,
        dataSlotCapacity: 2,
      });

      // L→R fill: markSignal(a) → [a, D]; markSignal(b) → [a, b]
      sector.markSignal('player-a'); // index 0
      sector.markSignal('player-b'); // index 1

      // Both have 1 marker. Tie-break = marker placed LATER = rightmost.
      // player-b at idx 1 wins; player-a takes 2nd.
      const result = sector.resolveCompletion();

      expect(result.winnerPlayerId).toBe('player-b');
      expect(result.secondPlacePlayerId).toBe('player-a');
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

      // L→R fill: [a, b]. Tie; b placed later → b wins, a 2nd.
      // Reset keeps 2nd at slot 0 → [a, D].
      sector.markSignal('player-a');
      sector.markSignal('player-b');
      sector.resolveCompletion();

      // 2nd round: a pre-placed at idx 0. markSignal replaces leftmost
      // data (idx 1) → [a, b]. Tie again; b placed later → b wins.
      sector.markSignal('player-b');

      expect(sector.isFulfilled()).toBe(true);
      sector.resolveCompletion();

      expect(sector.sectorWinners).toEqual(['player-b', 'player-b']);
    });

    it('isFirstWin is false on repeat win', () => {
      const sector = new Sector({
        id: 'sector-repeat',
        color: ESector.BLUE,
        dataSlotCapacity: 2,
      });

      // Round 1: [a, a] → a wins, no 2nd place (no other markers).
      sector.markSignal('player-a');
      sector.markSignal('player-a');
      const first = sector.resolveCompletion();
      expect(first.winnerPlayerId).toBe('player-a');
      expect(first.isFirstWin).toBe(true);

      // Round 2: sector fully reset (no 2nd place from round 1) → [D, D].
      // Place a, a again → a wins a 2nd time.
      sector.markSignal('player-a');
      sector.markSignal('player-a');
      const second = sector.resolveCompletion();
      expect(second.winnerPlayerId).toBe('player-a');
      expect(second.isFirstWin).toBe(false);
    });

    // 5.7 Second-place tie-break applies the same "later placed wins" rule.
    // 3 players on a capacity-4 sector:
    //   L→R fill → [p1, p2, p3, p1]
    //   p1 has 2 markers (wins). p2 at idx 1, p3 at idx 2 — both have 1.
    //   Tie-break: marker placed LATER wins 2nd → p3 (idx 2 > idx 1).
    it('breaks second-place ties by later-placed rule (3-player scenario)', () => {
      const sector = new Sector({
        id: 'sector-2nd-tie',
        color: ESector.RED,
        dataSlotCapacity: 4,
      });

      sector.markSignal('p1'); // [p1, D, D, D]
      sector.markSignal('p2'); // [p1, p2, D, D]
      sector.markSignal('p3'); // [p1, p2, p3, D]
      sector.markSignal('p1'); // [p1, p2, p3, p1]

      expect(sector.isFulfilled()).toBe(true);

      const result = sector.resolveCompletion();

      expect(result.winnerPlayerId).toBe('p1');
      expect(result.secondPlacePlayerId).toBe('p3');
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

      // L→R fill starting from [D, D, D, D, D]
      sector.markSignal('Red'); // → [Red, D, D, D, D]
      sector.markSignal('Green'); // → [Red, Green, D, D, D]
      sector.markSignal('Red'); // → [Red, Green, Red, D, D]
      sector.markSignal('Green'); // → [Red, Green, Red, Green, D]
      sector.markSignal('Blue'); // → [Red, Green, Red, Green, Blue]
      expect(sector.isFulfilled()).toBe(true);

      // Overflow: no data remains → append (no data gain, no VP)
      sector.markSignal('Blue'); // → [Red, Green, Red, Green, Blue, Blue]

      // Counts: Red=2 (idx 0,2), Green=2 (idx 1,3), Blue=2 (idx 4,5)
      // Rightmost-per-player: Blue@5, Green@3, Red@2
      // → Blue wins (later placed), Green 2nd.
      const result = sector.resolveCompletion();

      expect(result.winnerPlayerId).toBe('Blue');
      expect(result.secondPlacePlayerId).toBe('Green');

      // Reset places 2nd (Green) at slot 0 → [Green, D, D, D, D]
      expect(sector.signals).toHaveLength(5);
      expect(sector.signals[0]).toEqual({
        type: 'player',
        playerId: 'Green',
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
      expect(pub.signals[0]).toEqual({
        type: 'player',
        playerId: 'player-a',
      });
      expect(pub.signals[1].type).toBe('data');
      expect(pub.signals[2].type).toBe('data');
      expect(pub.dataSlotCapacity).toBe(3);
      expect(pub.sectorWinners).toEqual([]);
    });
  });
});
