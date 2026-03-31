import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import { AlienBoard } from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createMockGame(
  overrides: Partial<IGame> = {},
): IGame {
  return {
    players: [],
    eventLog: new EventLog(),
    ...overrides,
  } as unknown as IGame;
}

function createPlayer(id = 'p1'): Player {
  return new Player({
    id,
    name: id,
    color: 'red',
    seatIndex: 0,
  });
}

describe('AlienState', () => {
  describe('createFromHiddenAliens', () => {
    it('creates boards with 3 discovery slots + 1 overflow per alien', () => {
      const state = AlienState.createFromHiddenAliens([
        EAlienType.CENTAURIANS,
        EAlienType.EXERTIANS,
      ]);

      expect(state.boards).toHaveLength(2);
      expect(state.boards[0].alienType).toBe(EAlienType.CENTAURIANS);
      expect(state.boards[1].alienType).toBe(EAlienType.EXERTIANS);

      for (const board of state.boards) {
        expect(board.slots).toHaveLength(4);
        const discovery = board.slots.filter((s) => s.isDiscovery);
        const overflow = board.slots.filter((s) => !s.isDiscovery);
        expect(discovery).toHaveLength(3);
        expect(overflow).toHaveLength(1);
      }
    });

    it('creates discovery slots for R/Y/B colors', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const board = state.boards[0];
      const discoveryColors = board
        .getDiscoverySlots()
        .map((s) => s.traceColor);
      expect(discoveryColors).toContain(ETrace.RED);
      expect(discoveryColors).toContain(ETrace.YELLOW);
      expect(discoveryColors).toContain(ETrace.BLUE);
    });

    it('creates empty state when no aliens', () => {
      const state = AlienState.createFromHiddenAliens([]);
      expect(state.boards).toHaveLength(0);
    });
  });

  describe('overflow trace placement and VP', () => {
    it('awards 3 VP when placing trace in overflow slot', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });
      const scoreBefore = player.score;

      state.applyTrace(player, game, ETrace.RED, 0, true);

      expect(player.score).toBe(scoreBefore + 3);
    });

    it('increments player trace count on overflow', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      state.applyTrace(player, game, ETrace.RED, 0, true);

      expect(player.traces[ETrace.RED]).toBe(1);
      expect(state.boards[0].getPlayerTraceCount(player.id)).toBe(1);
    });

    it('allows multiple traces in overflow slot (unlimited)', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      state.applyTrace(player, game, ETrace.RED, 0, true);
      state.applyTrace(player, game, ETrace.YELLOW, 0, true);
      state.applyTrace(player, game, ETrace.BLUE, 0, true);

      expect(player.score).toBe(1 + 9);
      expect(state.boards[0].getPlayerTraceCount(player.id)).toBe(3);
    });

    it('emits TRACE_MARKED event with isOverflow=true for overflow', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const eventLog = new EventLog();
      const game = createMockGame({ players: [player], eventLog });

      state.applyTrace(player, game, ETrace.RED, 0, true);

      const events = eventLog.recent(5);
      const traceEvent = events.find((e) => e.type === 'TRACE_MARKED');
      expect(traceEvent).toBeDefined();
      expect((traceEvent as { isOverflow: boolean }).isOverflow).toBe(true);
    });

    it('emits TRACE_MARKED event with isOverflow=false for discovery', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const eventLog = new EventLog();
      const game = createMockGame({ players: [player], eventLog });

      state.applyTrace(player, game, ETrace.RED, 0, false);

      const events = eventLog.recent(5);
      const traceEvent = events.find((e) => e.type === 'TRACE_MARKED');
      expect(traceEvent).toBeDefined();
      expect((traceEvent as { isOverflow: boolean }).isOverflow).toBe(false);
    });
  });

  describe('applyTrace (discovery vs overflow preference)', () => {
    it('places in discovery slot when forceOverflow=false', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      state.applyTrace(player, game, ETrace.RED, 0, false);

      const discoverySlot = state.boards[0]
        .getDiscoverySlots()
        .find((s) => s.traceColor === ETrace.RED);
      expect(discoverySlot!.occupants).toHaveLength(1);
    });

    it('skips full discovery slot and falls back to overflow', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      state.applyTrace(player, game, ETrace.RED, 0, false);
      const scoreBefore = player.score;

      state.applyTrace(player, game, ETrace.RED, 0, false);

      expect(player.score).toBe(scoreBefore + 3);
    });
  });

  describe('discovery condition', () => {
    it('alien is discoverable when all 3 discovery slots are filled', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      state.applyTrace(player, game, ETrace.RED, 0, false);
      state.applyTrace(player, game, ETrace.YELLOW, 0, false);
      expect(state.getNewlyDiscoverableAliens()).toHaveLength(0);

      state.applyTrace(player, game, ETrace.BLUE, 0, false);
      expect(state.getNewlyDiscoverableAliens()).toHaveLength(1);
    });

    it('alien is not re-discoverable after discovered=true', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      state.applyTrace(player, game, ETrace.RED, 0, false);
      state.applyTrace(player, game, ETrace.YELLOW, 0, false);
      state.applyTrace(player, game, ETrace.BLUE, 0, false);

      state.boards[0].discovered = true;
      expect(state.getNewlyDiscoverableAliens()).toHaveLength(0);
    });
  });

  describe('neutral markers', () => {
    it('places neutral marker on first empty discovery slot', () => {
      const state = AlienState.createFromHiddenAliens([
        EAlienType.CENTAURIANS,
        EAlienType.EXERTIANS,
      ]);

      const result = state.placeNeutralMarker();

      expect(result).not.toBeNull();
      expect(result!.alienIndex).toBe(0);

      const slot = state.boards[0].getSlot(result!.slotId);
      expect(slot!.occupants).toHaveLength(1);
      expect(slot!.occupants[0].source).toBe('neutral');
    });

    it('moves to next alien when first alien discovery slots are full', () => {
      const state = AlienState.createFromHiddenAliens([
        EAlienType.CENTAURIANS,
        EAlienType.EXERTIANS,
      ]);

      state.placeNeutralMarker();
      state.placeNeutralMarker();
      state.placeNeutralMarker();

      const result = state.placeNeutralMarker();

      expect(result).not.toBeNull();
      expect(result!.alienIndex).toBe(1);
    });

    it('returns null when all discovery slots are full', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);

      state.placeNeutralMarker();
      state.placeNeutralMarker();
      state.placeNeutralMarker();

      const result = state.placeNeutralMarker();
      expect(result).toBeNull();
    });

    it('neutral markers count toward discovery condition', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);

      state.placeNeutralMarker();
      state.placeNeutralMarker();
      state.placeNeutralMarker();

      expect(state.boards[0].isFullyMarked()).toBe(true);
      expect(state.getNewlyDiscoverableAliens()).toHaveLength(1);
    });
  });

  describe('getAvailableTargets', () => {
    it('returns matching discovery + overflow slots', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const targets = state.getAvailableTargets(ETrace.RED);

      expect(targets.length).toBeGreaterThanOrEqual(2);
      const discoveryTarget = targets.find((t) => t.label.includes('Discovery'));
      const overflowTarget = targets.find((t) => t.label.includes('Overflow'));
      expect(discoveryTarget).toBeDefined();
      expect(overflowTarget).toBeDefined();
    });

    it('excludes filled discovery slots', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      state.applyTrace(player, game, ETrace.RED, 0, false);

      const targets = state.getAvailableTargets(ETrace.RED);
      const discoveryTarget = targets.find(
        (t) => t.label.includes('Discovery') && t.label.includes('Red'),
      );
      expect(discoveryTarget).toBeUndefined();
    });
  });
});

describe('AlienBoard', () => {
  function createBoard(): AlienBoard {
    return new AlienBoard({
      alienType: EAlienType.CENTAURIANS,
      alienIndex: 0,
      slots: [
        {
          slotId: 'disc-R',
          alienIndex: 0,
          traceColor: ETrace.RED,
          maxOccupants: 1,
          isDiscovery: true,
        },
        {
          slotId: 'disc-Y',
          alienIndex: 0,
          traceColor: ETrace.YELLOW,
          maxOccupants: 1,
          isDiscovery: true,
        },
        {
          slotId: 'disc-B',
          alienIndex: 0,
          traceColor: ETrace.BLUE,
          maxOccupants: 1,
          isDiscovery: true,
        },
        {
          slotId: 'overflow',
          alienIndex: 0,
          traceColor: ETrace.ANY,
          maxOccupants: -1,
          rewards: [{ type: 'VP', amount: 3 }],
          isDiscovery: false,
        },
      ],
    });
  }

  describe('placeTrace', () => {
    it('places trace in empty slot', () => {
      const board = createBoard();
      const slot = board.getSlot('disc-R')!;
      const result = board.placeTrace(slot, { playerId: 'p1' }, ETrace.RED);

      expect(result).toBe(true);
      expect(slot.occupants).toHaveLength(1);
    });

    it('rejects placement when slot is full (maxOccupants=1)', () => {
      const board = createBoard();
      const slot = board.getSlot('disc-R')!;
      board.placeTrace(slot, { playerId: 'p1' }, ETrace.RED);
      const result = board.placeTrace(slot, { playerId: 'p2' }, ETrace.RED);

      expect(result).toBe(false);
      expect(slot.occupants).toHaveLength(1);
    });

    it('allows unlimited placement in overflow (maxOccupants=-1)', () => {
      const board = createBoard();
      const slot = board.getSlot('overflow')!;

      for (let i = 0; i < 5; i++) {
        expect(board.placeTrace(slot, { playerId: `p${i}` }, ETrace.RED)).toBe(
          true,
        );
      }
      expect(slot.occupants).toHaveLength(5);
    });
  });

  describe('getAvailableSlots', () => {
    it('returns color-matching discovery + overflow slots', () => {
      const board = createBoard();
      const available = board.getAvailableSlots(ETrace.RED);

      expect(available.some((s) => s.slotId === 'disc-R')).toBe(true);
      expect(available.some((s) => s.slotId === 'overflow')).toBe(true);
      expect(available.some((s) => s.slotId === 'disc-Y')).toBe(false);
    });

    it('excludes full discovery slots', () => {
      const board = createBoard();
      const slot = board.getSlot('disc-R')!;
      board.placeTrace(slot, { playerId: 'p1' }, ETrace.RED);

      const available = board.getAvailableSlots(ETrace.RED);
      expect(available.some((s) => s.slotId === 'disc-R')).toBe(false);
      expect(available.some((s) => s.slotId === 'overflow')).toBe(true);
    });
  });

  describe('isFullyMarked', () => {
    it('returns false when any discovery slot is empty', () => {
      const board = createBoard();
      board.placeTrace(board.getSlot('disc-R')!, { playerId: 'p1' }, ETrace.RED);
      board.placeTrace(board.getSlot('disc-Y')!, { playerId: 'p1' }, ETrace.YELLOW);

      expect(board.isFullyMarked()).toBe(false);
    });

    it('returns true when all 3 discovery slots are occupied', () => {
      const board = createBoard();
      board.placeTrace(board.getSlot('disc-R')!, { playerId: 'p1' }, ETrace.RED);
      board.placeTrace(board.getSlot('disc-Y')!, { playerId: 'p1' }, ETrace.YELLOW);
      board.placeTrace(board.getSlot('disc-B')!, { playerId: 'p1' }, ETrace.BLUE);

      expect(board.isFullyMarked()).toBe(true);
    });
  });

  describe('getDiscoverers', () => {
    it('returns unique player IDs from discovery slots', () => {
      const board = createBoard();
      board.placeTrace(board.getSlot('disc-R')!, { playerId: 'p1' }, ETrace.RED);
      board.placeTrace(board.getSlot('disc-Y')!, { playerId: 'p2' }, ETrace.YELLOW);
      board.placeTrace(board.getSlot('disc-B')!, { playerId: 'p1' }, ETrace.BLUE);

      const discoverers = board.getDiscoverers();
      expect(discoverers).toContain('p1');
      expect(discoverers).toContain('p2');
      expect(discoverers).toHaveLength(2);
    });

    it('excludes neutral markers from discoverers', () => {
      const board = createBoard();
      board.placeTrace(board.getSlot('disc-R')!, 'neutral', ETrace.RED);
      board.placeTrace(board.getSlot('disc-Y')!, { playerId: 'p1' }, ETrace.YELLOW);
      board.placeTrace(board.getSlot('disc-B')!, { playerId: 'p1' }, ETrace.BLUE);

      const discoverers = board.getDiscoverers();
      expect(discoverers).toEqual(['p1']);
    });
  });

  describe('getPlayerTraceCount / getPlayerTraceCountByColor', () => {
    it('counts all traces for a player across all slots', () => {
      const board = createBoard();
      board.placeTrace(board.getSlot('disc-R')!, { playerId: 'p1' }, ETrace.RED);
      board.placeTrace(board.getSlot('overflow')!, { playerId: 'p1' }, ETrace.BLUE);

      expect(board.getPlayerTraceCount('p1')).toBe(2);
      expect(board.getPlayerTraceCount('p2')).toBe(0);
    });

    it('counts traces by color', () => {
      const board = createBoard();
      board.placeTrace(board.getSlot('disc-R')!, { playerId: 'p1' }, ETrace.RED);
      board.placeTrace(board.getSlot('overflow')!, { playerId: 'p1' }, ETrace.RED);
      board.placeTrace(board.getSlot('overflow')!, { playerId: 'p1' }, ETrace.BLUE);

      expect(board.getPlayerTraceCountByColor('p1', ETrace.RED)).toBe(2);
      expect(board.getPlayerTraceCountByColor('p1', ETrace.BLUE)).toBe(1);
    });
  });

  describe('addSlot', () => {
    it('adds a new slot dynamically', () => {
      const board = createBoard();
      const before = board.slots.length;

      board.addSlot({
        slotId: 'extra',
        alienIndex: 0,
        traceColor: ETrace.RED,
        maxOccupants: 2,
        isDiscovery: false,
      });

      expect(board.slots.length).toBe(before + 1);
      expect(board.getSlot('extra')).toBeDefined();
    });
  });
});
