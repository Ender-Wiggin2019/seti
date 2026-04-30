import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { AlienBoard } from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { placeTraceForTestSetup } from '../../helpers/traceTestUtils.js';

function createMockGame(overrides: Partial<IGame> = {}): IGame {
  return {
    players: [],
    eventLog: new EventLog(),
    lockCurrentTurn: () => undefined,
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
    it('creates boards with 3 discovery slots + 3 color-specific overflow slots per alien', () => {
      const state = AlienState.createFromHiddenAliens([
        EAlienType.CENTAURIANS,
        EAlienType.EXERTIANS,
      ]);

      expect(state.boards).toHaveLength(2);
      expect(state.boards[0].alienType).toBe(EAlienType.CENTAURIANS);
      expect(state.boards[1].alienType).toBe(EAlienType.EXERTIANS);

      for (const board of state.boards) {
        expect(board.slots).toHaveLength(6);
        const discovery = board.slots.filter((s) => s.isDiscovery);
        const overflow = board.slots.filter((s) =>
          s.slotId.includes('overflow'),
        );
        expect(discovery).toHaveLength(3);
        expect(overflow).toHaveLength(3);
        expect(overflow.map((s) => s.traceColor).sort()).toEqual(
          [ETrace.BLUE, ETrace.RED, ETrace.YELLOW].sort(),
        );
        expect(overflow.every((s) => s.maxOccupants === -1)).toBe(true);
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

  describe('trace player input', () => {
    it('keeps fixed-color, fixed-alien trace placement as a player slot choice', () => {
      const state = AlienState.createFromHiddenAliens([
        EAlienType.CENTAURIANS,
        EAlienType.EXERTIANS,
      ]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      const input = state.createTraceInput(player, game, ETrace.RED, {
        alien: 0,
      });

      expect(input).toBeDefined();
      const model = input!.toModel();
      expect(model.type).toBe(EPlayerInputType.OPTION);
      if (model.type !== EPlayerInputType.OPTION) {
        throw new Error('Expected trace slot option input');
      }

      const optionIds = model.options.map((option) => option.id);
      expect(optionIds).toContain(`alien-0-discovery-${ETrace.RED}`);
      expect(optionIds).toContain(`alien-0-overflow-${ETrace.RED}`);
      expect(optionIds.some((id) => id.startsWith('alien-1-'))).toBe(false);
      expect(state.boards[0].getPlayerTraceCount(player.id)).toBe(0);

      input!.process({
        type: EPlayerInputType.OPTION,
        optionId: `alien-0-overflow-${ETrace.RED}`,
      });

      expect(state.boards[0].getPlayerTraceCount(player.id)).toBe(1);
      expect(
        state.boards[0].getSlot(`alien-0-discovery-${ETrace.RED}`)!.occupants,
      ).toHaveLength(0);
      expect(
        state.boards[0].getSlot(`alien-0-overflow-${ETrace.RED}`)!.occupants,
      ).toHaveLength(1);
    });

    it('does not expose legacy automatic trace placement as public game logic', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);

      expect(
        (state as unknown as { applyTrace?: unknown }).applyTrace,
      ).toBeUndefined();
    });
  });

  describe('overflow trace placement and VP', () => {
    it('awards 3 VP when placing trace in overflow slot', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });
      const scoreBefore = player.score;

      placeTraceForTestSetup(state, player, game, ETrace.RED, 0, {
        forceOverflow: true,
      });

      expect(player.score).toBe(scoreBefore + 3);
    });

    it('increments player trace count on overflow', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      placeTraceForTestSetup(state, player, game, ETrace.RED, 0, {
        forceOverflow: true,
      });

      expect(player.traces[ETrace.RED]).toBe(1);
      expect(state.boards[0].getPlayerTraceCount(player.id)).toBe(1);
    });

    it('allows multiple traces in overflow slot (unlimited)', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      placeTraceForTestSetup(state, player, game, ETrace.RED, 0, {
        forceOverflow: true,
      });
      placeTraceForTestSetup(state, player, game, ETrace.YELLOW, 0, {
        forceOverflow: true,
      });
      placeTraceForTestSetup(state, player, game, ETrace.BLUE, 0, {
        forceOverflow: true,
      });

      expect(player.score).toBe(1 + 9);
      expect(state.boards[0].getPlayerTraceCount(player.id)).toBe(3);
    });

    it('emits TRACE_MARKED event with isOverflow=true for overflow', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const eventLog = new EventLog();
      const game = createMockGame({ players: [player], eventLog });

      placeTraceForTestSetup(state, player, game, ETrace.RED, 0, {
        forceOverflow: true,
      });

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

      placeTraceForTestSetup(state, player, game, ETrace.RED, 0);

      const events = eventLog.recent(5);
      const traceEvent = events.find((e) => e.type === 'TRACE_MARKED');
      expect(traceEvent).toBeDefined();
      expect((traceEvent as { isOverflow: boolean }).isOverflow).toBe(false);
    });
  });

  describe('test fixture trace placement helper', () => {
    it('places in discovery slot by default', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      placeTraceForTestSetup(state, player, game, ETrace.RED, 0);

      const discoverySlot = state.boards[0]
        .getDiscoverySlots()
        .find((s) => s.traceColor === ETrace.RED);
      expect(discoverySlot!.occupants).toHaveLength(1);
    });

    it('falls back to overflow when the matching discovery slot is full', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      placeTraceForTestSetup(state, player, game, ETrace.RED, 0);
      const scoreBefore = player.score;

      placeTraceForTestSetup(state, player, game, ETrace.RED, 0);

      expect(player.score).toBe(scoreBefore + 3);
    });
  });

  describe('discovery condition', () => {
    it('alien is discoverable when all 3 discovery slots are filled', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      placeTraceForTestSetup(state, player, game, ETrace.RED, 0);
      placeTraceForTestSetup(state, player, game, ETrace.YELLOW, 0);
      expect(state.getNewlyDiscoverableAliens()).toHaveLength(0);

      placeTraceForTestSetup(state, player, game, ETrace.BLUE, 0);
      expect(state.getNewlyDiscoverableAliens()).toHaveLength(1);
    });

    it('alien is not re-discoverable after discovered=true', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      placeTraceForTestSetup(state, player, game, ETrace.RED, 0);
      placeTraceForTestSetup(state, player, game, ETrace.YELLOW, 0);
      placeTraceForTestSetup(state, player, game, ETrace.BLUE, 0);

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
      const discoveryTarget = targets.find((t) =>
        t.label.includes('Discovery'),
      );
      const overflowTarget = targets.find(
        (t) => t.slotId === `alien-0-overflow-${ETrace.RED}`,
      );
      expect(discoveryTarget).toBeDefined();
      expect(overflowTarget).toBeDefined();
      expect(overflowTarget?.traceColor).toBe(ETrace.RED);
    });

    it('returns concrete overflow option ids for universal traces without synthetic color suffixes', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const targets = state.getAvailableTargets(ETrace.ANY);

      expect(targets.map((target) => target.optionId)).toContain(
        `alien-0-overflow-${ETrace.RED}`,
      );
      expect(targets.map((target) => target.optionId)).toContain(
        `alien-0-overflow-${ETrace.YELLOW}`,
      );
      expect(targets.map((target) => target.optionId)).toContain(
        `alien-0-overflow-${ETrace.BLUE}`,
      );
      expect(targets.some((target) => target.optionId.includes('|'))).toBe(
        false,
      );
    });

    it('excludes filled discovery slots', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.CENTAURIANS]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      placeTraceForTestSetup(state, player, game, ETrace.RED, 0);

      const targets = state.getAvailableTargets(ETrace.RED);
      const discoveryTarget = targets.find(
        (t) => t.label.includes('Discovery') && t.label.includes('Red'),
      );
      expect(discoveryTarget).toBeUndefined();
    });
  });

  describe('getPlayerTraceCount', () => {
    it('counts a player trace by color across one alien or both aliens', () => {
      const state = AlienState.createFromHiddenAliens([
        EAlienType.CENTAURIANS,
        EAlienType.EXERTIANS,
      ]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      state.applyTraceToSlot(
        player,
        game,
        `alien-0-discovery-${ETrace.RED}`,
        ETrace.RED,
      );
      state.applyTraceToSlot(
        player,
        game,
        `alien-0-overflow-${ETrace.RED}`,
        ETrace.RED,
      );
      state.applyTraceToSlot(
        player,
        game,
        `alien-1-discovery-${ETrace.RED}`,
        ETrace.RED,
      );
      state.applyTraceToSlot(
        player,
        game,
        `alien-1-discovery-${ETrace.BLUE}`,
        ETrace.BLUE,
      );

      expect(state.boards[0].getPlayerTraceCount(player, ETrace.RED)).toBe(2);
      expect(
        state.getPlayerTraceCount(player, ETrace.RED, state.boards[0]),
      ).toBe(2);
      expect(state.getPlayerTraceCount(player, ETrace.RED, 1)).toBe(1);
      expect(
        state.getPlayerTraceCount(player.id, ETrace.RED, {
          alienType: EAlienType.EXERTIANS,
        }),
      ).toBe(1);
      expect(state.getPlayerTraceCount(player, ETrace.RED, 'both')).toBe(3);
      expect(state.getPlayerTraceCount(player, ETrace.ANY, 'both')).toBe(4);
    });
  });

  describe('draw alien card input flow', () => {
    it('prompts alien selection when no alien type is provided', () => {
      const state = AlienState.createFromHiddenAliens([
        EAlienType.ANOMALIES,
        EAlienType.CENTAURIANS,
      ]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });

      state.boards[0].discovered = true;
      state.boards[0].initializeAlienDeck(['ET.11']);
      state.boards[1].discovered = true;
      state.boards[1].initializeAlienDeck(['ET.31']);

      const input = state.createDrawAlienCardInput(player, game);
      expect(input).toBeDefined();

      const model = input!.toModel();
      expect(model.type).toBe(EPlayerInputType.OPTION);
      if (model.type !== EPlayerInputType.OPTION) {
        throw new Error('Expected option input model');
      }
      expect(model.options).toHaveLength(2);
    });

    it('draws from selected source when alien type is specified', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.ANOMALIES]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });
      const board = state.boards[0];

      board.discovered = true;
      board.initializeAlienDeck(['ET.11', 'ET.12']);
      board.revealNextFaceUpAlienCard();

      const input = state.createDrawAlienCardInput(player, game, {
        alienType: EAlienType.ANOMALIES,
      });
      expect(input).toBeDefined();

      const sourceModel = input!.toModel();
      expect(sourceModel.type).toBe(EPlayerInputType.OPTION);

      const next = input!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'draw-face-up',
      });
      expect(next).toBeUndefined();
      expect(player.hand).toContain('ET.11');
      expect(board.faceUpAlienCardId).toBe('ET.12');
    });

    it('reshuffles alien discard when drawing from deck and draw pile is empty', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.ANOMALIES]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });
      const board = state.boards[0];

      board.discovered = true;
      board.alienDeckDrawPile = [];
      board.alienDeckDiscardPile = ['ET.31', 'ET.32'];

      const drawn = state.drawAlienCard(player, board, 'deck', game);

      expect(drawn).toBe('ET.31');
      expect(player.hand).toContain('ET.31');
      expect(board.alienDeckDrawPile).toEqual(['ET.32']);
      expect(board.alienDeckDiscardPile).toEqual([]);
    });

    it('refills face-up from reshuffled alien discard after drawing face-up', () => {
      const state = AlienState.createFromHiddenAliens([EAlienType.ANOMALIES]);
      const player = createPlayer();
      const game = createMockGame({ players: [player] });
      const board = state.boards[0];

      board.discovered = true;
      board.alienDeckDrawPile = ['ET.11'];
      board.alienDeckDiscardPile = ['ET.12'];
      board.revealNextFaceUpAlienCard();

      const input = state.createDrawAlienCardInput(player, game, {
        alienType: EAlienType.ANOMALIES,
      });
      expect(input).toBeDefined();

      const next = input!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'draw-face-up',
      });

      expect(next).toBeUndefined();
      expect(player.hand).toContain('ET.11');
      expect(board.faceUpAlienCardId).toBe('ET.12');
      expect(board.alienDeckDiscardPile).toEqual([]);
    });

    it('trace bonus DRAW_ALIEN_CARD defaults to current alien board', () => {
      const state = new AlienState({
        aliens: [
          {
            alienType: EAlienType.ANOMALIES,
            alienIndex: 0,
            discovered: true,
            slots: [
              {
                slotId: 'custom-red',
                alienIndex: 0,
                traceColor: ETrace.RED,
                maxOccupants: 1,
                rewards: [{ type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' }],
                isDiscovery: false,
              },
            ],
          },
        ],
      });
      const player = createPlayer();
      const game = createMockGame({ players: [player] });
      const board = state.boards[0];
      board.initializeAlienDeck(['ET.11', 'ET.12']);
      board.revealNextFaceUpAlienCard();

      const input = state.createTraceInput(player, game, ETrace.RED);
      expect(input).toBeDefined();

      const model = input!.toModel();
      expect(model.type).toBe(EPlayerInputType.OPTION);
      if (model.type !== EPlayerInputType.OPTION) {
        throw new Error('Expected option input model');
      }
      // Must be source choice directly, not alien-board choice.
      expect(model.options.some((option) => option.id === 'draw-face-up')).toBe(
        true,
      );
    });

    it('continues onComplete after resolving trace bonus DRAW_ALIEN_CARD input', () => {
      const state = new AlienState({
        aliens: [
          {
            alienType: EAlienType.ANOMALIES,
            alienIndex: 0,
            discovered: true,
            slots: [
              {
                slotId: 'custom-red',
                alienIndex: 0,
                traceColor: ETrace.RED,
                maxOccupants: 1,
                rewards: [{ type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' }],
                isDiscovery: false,
              },
            ],
          },
        ],
      });
      const player = createPlayer();
      const game = createMockGame({ players: [player] });
      const board = state.boards[0];
      board.initializeAlienDeck(['ET.11', 'ET.12']);
      board.revealNextFaceUpAlienCard();

      let didContinue = false;
      const input = state.createTraceInput(player, game, ETrace.RED, {
        onComplete: () => {
          didContinue = true;
          return undefined;
        },
      });
      expect(input).toBeDefined();

      const next = input!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'draw-face-up',
      });

      expect(next).toBeUndefined();
      expect(player.hand).toContain('ET.11');
      expect(didContinue).toBe(true);
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
          slotId: 'overflow-red',
          alienIndex: 0,
          traceColor: ETrace.RED,
          maxOccupants: -1,
          rewards: [{ type: 'VP', amount: 3 }],
          isDiscovery: false,
        },
        {
          slotId: 'overflow-yellow',
          alienIndex: 0,
          traceColor: ETrace.YELLOW,
          maxOccupants: -1,
          rewards: [{ type: 'VP', amount: 3 }],
          isDiscovery: false,
        },
        {
          slotId: 'overflow-blue',
          alienIndex: 0,
          traceColor: ETrace.BLUE,
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
      const slot = board.getSlot('overflow-red')!;

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
      expect(available.some((s) => s.slotId === 'overflow-red')).toBe(true);
      expect(available.some((s) => s.slotId === 'overflow-blue')).toBe(false);
      expect(available.some((s) => s.slotId === 'disc-Y')).toBe(false);
    });

    it('excludes full discovery slots', () => {
      const board = createBoard();
      const slot = board.getSlot('disc-R')!;
      board.placeTrace(slot, { playerId: 'p1' }, ETrace.RED);

      const available = board.getAvailableSlots(ETrace.RED);
      expect(available.some((s) => s.slotId === 'disc-R')).toBe(false);
      expect(available.some((s) => s.slotId === 'overflow-red')).toBe(true);
    });
  });

  describe('isFullyMarked', () => {
    it('returns false when any discovery slot is empty', () => {
      const board = createBoard();
      board.placeTrace(
        board.getSlot('disc-R')!,
        { playerId: 'p1' },
        ETrace.RED,
      );
      board.placeTrace(
        board.getSlot('disc-Y')!,
        { playerId: 'p1' },
        ETrace.YELLOW,
      );

      expect(board.isFullyMarked()).toBe(false);
    });

    it('returns true when all 3 discovery slots are occupied', () => {
      const board = createBoard();
      board.placeTrace(
        board.getSlot('disc-R')!,
        { playerId: 'p1' },
        ETrace.RED,
      );
      board.placeTrace(
        board.getSlot('disc-Y')!,
        { playerId: 'p1' },
        ETrace.YELLOW,
      );
      board.placeTrace(
        board.getSlot('disc-B')!,
        { playerId: 'p1' },
        ETrace.BLUE,
      );

      expect(board.isFullyMarked()).toBe(true);
    });
  });

  describe('getDiscoverers', () => {
    it('returns unique player IDs from discovery slots', () => {
      const board = createBoard();
      board.placeTrace(
        board.getSlot('disc-R')!,
        { playerId: 'p1' },
        ETrace.RED,
      );
      board.placeTrace(
        board.getSlot('disc-Y')!,
        { playerId: 'p2' },
        ETrace.YELLOW,
      );
      board.placeTrace(
        board.getSlot('disc-B')!,
        { playerId: 'p1' },
        ETrace.BLUE,
      );

      const discoverers = board.getDiscoverers();
      expect(discoverers).toContain('p1');
      expect(discoverers).toContain('p2');
      expect(discoverers).toHaveLength(2);
    });

    it('excludes neutral markers from discoverers', () => {
      const board = createBoard();
      board.placeTrace(board.getSlot('disc-R')!, 'neutral', ETrace.RED);
      board.placeTrace(
        board.getSlot('disc-Y')!,
        { playerId: 'p1' },
        ETrace.YELLOW,
      );
      board.placeTrace(
        board.getSlot('disc-B')!,
        { playerId: 'p1' },
        ETrace.BLUE,
      );

      const discoverers = board.getDiscoverers();
      expect(discoverers).toEqual(['p1']);
    });
  });

  describe('getPlayerTraceCount / getPlayerTraceCountByColor', () => {
    it('counts all traces for a player across all slots', () => {
      const board = createBoard();
      board.placeTrace(
        board.getSlot('disc-R')!,
        { playerId: 'p1' },
        ETrace.RED,
      );
      board.placeTrace(
        board.getSlot('overflow-blue')!,
        { playerId: 'p1' },
        ETrace.BLUE,
      );

      expect(board.getPlayerTraceCount('p1')).toBe(2);
      expect(board.getPlayerTraceCount('p2')).toBe(0);
    });

    it('counts traces by color', () => {
      const board = createBoard();
      board.placeTrace(
        board.getSlot('disc-R')!,
        { playerId: 'p1' },
        ETrace.RED,
      );
      board.placeTrace(
        board.getSlot('overflow-red')!,
        { playerId: 'p1' },
        ETrace.RED,
      );
      board.placeTrace(
        board.getSlot('overflow-blue')!,
        { playerId: 'p1' },
        ETrace.BLUE,
      );

      expect(board.getPlayerTraceCountByColor('p1', ETrace.RED)).toBe(2);
      expect(board.getPlayerTraceCountByColor('p1', ETrace.BLUE)).toBe(1);
    });
  });

  describe('addTraceSlot', () => {
    it('adds a new slot dynamically', () => {
      const board = createBoard();
      const before = board.slots.length;

      board.addTraceSlot({
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

  describe('alien deck helpers', () => {
    it('initializes deck and reveals face-up card', () => {
      const board = createBoard();
      board.initializeAlienDeck(['a1', 'a2', 'a3']);

      expect(board.faceUpAlienCardId).toBeNull();
      expect(board.alienDeckDrawPile).toEqual(['a1', 'a2', 'a3']);

      board.revealNextFaceUpAlienCard();
      expect(board.faceUpAlienCardId).toBe('a1');
      expect(board.alienDeckDrawPile).toEqual(['a2', 'a3']);
    });

    it('draws face-up card and auto-refills next face-up', () => {
      const board = createBoard();
      board.initializeAlienDeck(['a1', 'a2']);
      board.revealNextFaceUpAlienCard();

      const drawn = board.drawFaceUpAlienCard();

      expect(drawn).toBe('a1');
      expect(board.faceUpAlienCardId).toBe('a2');
      expect(board.alienDeckDrawPile).toEqual([]);
    });

    it('recycles discard pile when deck is empty', () => {
      const board = createBoard();
      board.alienDeckDrawPile = [];
      board.alienDeckDiscardPile = ['d1', 'd2'];

      const drawn = board.drawAlienCardFromDeck();

      expect(drawn).toBe('d1');
      expect(board.alienDeckDrawPile).toEqual(['d2']);
      expect(board.alienDeckDiscardPile).toEqual([]);
    });
  });
});
