import { ETrace } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
  type ISelectTraceInputModel,
} from '@seti/common/types/protocol/playerInput';
import { Game } from '@/engine/Game.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

const BASE_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

describe('Phase 6.1: Life Trace Marking', () => {
  describe('6.1.1 [集成] 获得生命痕迹图标 → 放到对应颜色发现位', () => {
    it('places red trace on red discovery slot', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'life-trace-1',
      );
      const player = game.players[0];
      const board = game.alienState.boards[0];

      const redDiscoverySlot = board.slots.find(
        (s) => s.isDiscovery && s.traceColor === ETrace.RED,
      );
      expect(redDiscoverySlot).toBeDefined();
      expect(redDiscoverySlot!.occupants).toHaveLength(0);

      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);

      expect(redDiscoverySlot!.occupants).toHaveLength(1);
      expect(redDiscoverySlot!.occupants[0]).toMatchObject({
        source: { playerId: player.id },
        traceColor: ETrace.RED,
      });
    });

    it('places yellow trace on yellow discovery slot', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'life-trace-2',
      );
      const player = game.players[0];
      const board = game.alienState.boards[0];

      const yellowDiscoverySlot = board.slots.find(
        (s) => s.isDiscovery && s.traceColor === ETrace.YELLOW,
      );
      expect(yellowDiscoverySlot).toBeDefined();
      expect(yellowDiscoverySlot!.occupants).toHaveLength(0);

      game.alienState.applyTrace(player, game, ETrace.YELLOW, 0, false);

      expect(yellowDiscoverySlot!.occupants).toHaveLength(1);
      expect(yellowDiscoverySlot!.occupants[0]).toMatchObject({
        source: { playerId: player.id },
        traceColor: ETrace.YELLOW,
      });
    });

    it('places blue trace on blue discovery slot', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'life-trace-3',
      );
      const player = game.players[0];
      const board = game.alienState.boards[0];

      const blueDiscoverySlot = board.slots.find(
        (s) => s.isDiscovery && s.traceColor === ETrace.BLUE,
      );
      expect(blueDiscoverySlot).toBeDefined();
      expect(blueDiscoverySlot!.occupants).toHaveLength(0);

      game.alienState.applyTrace(player, game, ETrace.BLUE, 0, false);

      expect(blueDiscoverySlot!.occupants).toHaveLength(1);
      expect(blueDiscoverySlot!.occupants[0]).toMatchObject({
        source: { playerId: player.id },
        traceColor: ETrace.BLUE,
      });
    });
  });

  describe('6.1.2 [集成] 两个对应位已满且种族未发现 → overflow', () => {
    it('places red trace in overflow when red discovery slot is full', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'overflow-1');
      const player = game.players[0];
      const board = game.alienState.boards[0];

      // Fill red discovery slot
      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);

      const redDiscoverySlot = board.slots.find(
        (s) => s.isDiscovery && s.traceColor === ETrace.RED,
      );
      const overflowSlot = board.slots.find((s) => !s.isDiscovery);

      expect(redDiscoverySlot!.occupants).toHaveLength(1);
      expect(overflowSlot!.occupants).toHaveLength(0);

      // Attempt to place another red trace
      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);

      // Should go to overflow
      expect(redDiscoverySlot!.occupants).toHaveLength(1);
      expect(overflowSlot!.occupants).toHaveLength(1);
      expect(overflowSlot!.occupants[0]).toMatchObject({
        source: { playerId: player.id },
        traceColor: ETrace.RED,
      });
    });

    it('places yellow trace in overflow when yellow discovery slot is full', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'overflow-2');
      const player = game.players[0];
      const board = game.alienState.boards[0];

      // Fill yellow discovery slot
      game.alienState.applyTrace(player, game, ETrace.YELLOW, 0, false);

      const yellowDiscoverySlot = board.slots.find(
        (s) => s.isDiscovery && s.traceColor === ETrace.YELLOW,
      );
      const overflowSlot = board.slots.find((s) => !s.isDiscovery);

      expect(yellowDiscoverySlot!.occupants).toHaveLength(1);
      expect(overflowSlot!.occupants).toHaveLength(0);

      // Attempt to place another yellow trace
      game.alienState.applyTrace(player, game, ETrace.YELLOW, 0, false);

      // Should go to overflow
      expect(yellowDiscoverySlot!.occupants).toHaveLength(1);
      expect(overflowSlot!.occupants).toHaveLength(1);
      expect(overflowSlot!.occupants[0]).toMatchObject({
        source: { playerId: player.id },
        traceColor: ETrace.YELLOW,
      });
    });
  });

  describe('6.1.3 [集成] 发现位 +1 声望 + 5 VP', () => {
    it('grants 1 publicity and 5 VP when placing trace in discovery slot', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'discovery-rewards',
      );
      const player = game.players[0];
      const initialScore = player.score;
      const initialPublicity = player.resources.publicity;

      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);

      expect(player.score).toBe(initialScore + 5);
      expect(player.resources.publicity).toBe(initialPublicity + 1);
    });

    it('grants rewards for each color discovery slot', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'discovery-all-colors',
      );
      const player = game.players[0];
      const initialScore = player.score;
      const initialPublicity = player.resources.publicity;

      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);
      game.alienState.applyTrace(player, game, ETrace.YELLOW, 0, false);
      game.alienState.applyTrace(player, game, ETrace.BLUE, 0, false);

      expect(player.score).toBe(initialScore + 15);
      expect(player.resources.publicity).toBe(initialPublicity + 3);
    });
  });

  describe('6.1.4 [集成] overflow 位 3 VP', () => {
    it('grants 3 VP when placing trace in overflow slot', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'overflow-vp');
      const player = game.players[0];

      // Fill red discovery slot
      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);

      const scoreBeforeOverflow = player.score;

      // Place another red trace, should go to overflow
      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);

      expect(player.score).toBe(scoreBeforeOverflow + 3);
    });

    it('grants 3 VP for each overflow trace', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'overflow-multiple',
      );
      const player = game.players[0];

      // Fill all discovery slots
      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);
      game.alienState.applyTrace(player, game, ETrace.YELLOW, 0, false);
      game.alienState.applyTrace(player, game, ETrace.BLUE, 0, false);

      const scoreBeforeOverflow = player.score;

      // Place additional traces in overflow
      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);
      game.alienState.applyTrace(player, game, ETrace.YELLOW, 0, false);

      expect(player.score).toBe(scoreBeforeOverflow + 6);
    });
  });

  describe('6.1.5 [集成] universal trace 充当任意颜色', () => {
    it('allows player to choose any color for universal trace', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'universal-trace',
      );
      const player = game.players[0];
      const board = game.alienState.boards[0];

      // Create input for universal trace
      const input = game.alienState.createTraceInput(player, game, ETrace.ANY);

      expect(input).toBeDefined();
      expect(input?.toModel().type).toBe(EPlayerInputType.TRACE);

      const traceModel = input?.toModel() as ISelectTraceInputModel;
      expect(traceModel.options).toContain(ETrace.RED);
      expect(traceModel.options).toContain(ETrace.YELLOW);
      expect(traceModel.options).toContain(ETrace.BLUE);
    });

    it('places universal trace in chosen color discovery slot', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'universal-placement',
      );
      const player = game.players[0];
      const board = game.alienState.boards[0];

      const redDiscoverySlot = board.slots.find(
        (s) => s.isDiscovery && s.traceColor === ETrace.RED,
      );

      expect(redDiscoverySlot!.occupants).toHaveLength(0);

      // Manually apply universal trace as red
      const targets = game.alienState.getAvailableTargets(ETrace.RED);
      const redTarget = targets.find(
        (t) => t.label.includes('Discovery') && t.label.includes('Red'),
      );

      expect(redTarget).toBeDefined();
      game.alienState.applyTraceToSlot(
        player,
        game,
        redTarget!.slotId,
        ETrace.ANY,
      );

      expect(redDiscoverySlot!.occupants).toHaveLength(1);
    });
  });

  describe('6.1.6 [集成] overflow 标记计入"已标记痕迹"检查', () => {
    it('overflow traces count toward player trace total', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'overflow-count',
      );
      const player = game.players[0];

      // Place red in discovery
      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);
      expect(player.traces[ETrace.RED]).toBe(1);

      // Place red in overflow
      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);
      expect(player.traces[ETrace.RED]).toBe(2);
    });

    it('overflow traces count toward alien-specific trace checks', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'overflow-alien-count',
      );
      const player = game.players[0];
      const board = game.alienState.boards[0];

      // Place traces in discovery
      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);
      expect(board.getPlayerTraceCount(player.id)).toBe(1);

      // Place trace in overflow
      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);
      expect(board.getPlayerTraceCount(player.id)).toBe(2);

      // Place another color in overflow
      game.alienState.applyTrace(player, game, ETrace.YELLOW, 0, false);
      game.alienState.applyTrace(player, game, ETrace.YELLOW, 0, false);
      expect(board.getPlayerTraceCount(player.id)).toBe(4);
    });

    it('overflow traces are reflected in player tracesByAlien', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'overflow-by-alien',
      );
      const player = game.players[0];

      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);
      expect(player.tracesByAlien[0]?.[ETrace.RED]).toBe(1);

      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);
      expect(player.tracesByAlien[0]?.[ETrace.RED]).toBe(2);
    });
  });

  describe('6.1.7 [集成] alien board 额外位不需按顺序填', () => {
    it('allows placing trace in dynamically added slots', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'extra-slots');
      const player = game.players[0];
      const board = game.alienState.boards[0];

      // Add extra slots dynamically (simulating post-discovery expansion)
      const extraSlot1 = board.addSlot({
        slotId: 'extra-red-1',
        alienIndex: 0,
        traceColor: ETrace.RED,
        maxOccupants: 1,
        rewards: [{ type: 'VP', amount: 2 }],
        isDiscovery: false,
      });

      const extraSlot2 = board.addSlot({
        slotId: 'extra-red-2',
        alienIndex: 0,
        traceColor: ETrace.RED,
        maxOccupants: 1,
        rewards: [{ type: 'VP', amount: 2 }],
        isDiscovery: false,
      });

      // Fill first extra slot
      game.alienState.applyTraceToSlot(
        player,
        game,
        extraSlot1.slotId,
        ETrace.RED,
      );
      expect(extraSlot1.occupants).toHaveLength(1);
      expect(extraSlot2.occupants).toHaveLength(0);

      // Can fill second without filling first
      const player2 = game.players[1];
      game.alienState.applyTraceToSlot(
        player2,
        game,
        extraSlot2.slotId,
        ETrace.RED,
      );
      expect(extraSlot2.occupants).toHaveLength(1);
    });

    it('extra slots are available in getAvailableTargets', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'extra-targets',
      );
      const board = game.alienState.boards[0];

      board.addSlot({
        slotId: 'extra-yellow',
        alienIndex: 0,
        traceColor: ETrace.YELLOW,
        maxOccupants: 1,
        rewards: [{ type: 'VP', amount: 3 }],
        isDiscovery: false,
      });

      const targets = game.alienState.getAvailableTargets(ETrace.YELLOW);
      const extraTarget = targets.find((t) => t.slotId === 'extra-yellow');

      expect(extraTarget).toBeDefined();
      expect(extraTarget?.alienIndex).toBe(0);
    });
  });

  describe('6.1.8 [集成] 可选择任何未占据的对应颜色空间', () => {
    it('allows player to choose between discovery and overflow slots', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'choice-slots',
      );
      const player = game.players[0];

      const targets = game.alienState.getAvailableTargets(ETrace.RED);

      // Should have at least discovery + overflow available
      const discoveryTargets = targets.filter((t) =>
        t.label.includes('Discovery'),
      );
      const overflowTargets = targets.filter((t) =>
        t.label.includes('Overflow'),
      );

      expect(discoveryTargets.length).toBeGreaterThan(0);
      expect(overflowTargets.length).toBeGreaterThan(0);
    });

    it('allows choosing specific slot when multiple aliens available', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'multi-alien');
      const player = game.players[0];

      // Both aliens should have red discovery slots
      const targets = game.alienState.getAvailableTargets(ETrace.RED);
      const alien0Targets = targets.filter((t) => t.alienIndex === 0);
      const alien1Targets = targets.filter((t) => t.alienIndex === 1);

      expect(alien0Targets.length).toBeGreaterThan(0);
      expect(alien1Targets.length).toBeGreaterThan(0);

      // Place on alien 0
      const alien0Target = alien0Targets.find((t) =>
        t.label.includes('Discovery'),
      );
      expect(alien0Target).toBeDefined();

      game.alienState.applyTraceToSlot(
        player,
        game,
        alien0Target!.slotId,
        ETrace.RED,
      );

      const board0 = game.alienState.boards[0];
      const board1 = game.alienState.boards[1];

      expect(board0.getPlayerTraceCount(player.id)).toBe(1);
      expect(board1.getPlayerTraceCount(player.id)).toBe(0);
    });

    it('excludes occupied discovery slots from available targets', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'exclude-occupied',
      );
      const player = game.players[0];

      // Fill red discovery slot on alien 0
      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);

      const targets = game.alienState.getAvailableTargets(ETrace.RED);
      const alien0Discovery = targets.find(
        (t) =>
          t.alienIndex === 0 &&
          t.label.includes('Discovery') &&
          t.label.includes('Red'),
      );

      // Red discovery on alien 0 should not be available
      expect(alien0Discovery).toBeUndefined();

      // But overflow and alien 1 discovery should be available
      const alien0Overflow = targets.find(
        (t) => t.alienIndex === 0 && t.label.includes('Overflow'),
      );
      const alien1Discovery = targets.find(
        (t) => t.alienIndex === 1 && t.label.includes('Discovery'),
      );

      expect(alien0Overflow).toBeDefined();
      expect(alien1Discovery).toBeDefined();
    });
  });
});
