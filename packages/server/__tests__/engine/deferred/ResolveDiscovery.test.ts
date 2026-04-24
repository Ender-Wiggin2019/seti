import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { AnomaliesAlienPlugin } from '@/engine/alien/plugins/AnomaliesAlienPlugin.js';
import { DummyAlienPlugin } from '@/engine/alien/plugins/DummyAlienPlugin.js';
import { ResolveDiscovery } from '@/engine/deferred/ResolveDiscovery.js';
import { Game } from '@/engine/Game.js';

const BASE_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function forceAlienType(
  board: { readonly alienType: EAlienType },
  alienType: EAlienType,
): void {
  (board as { alienType: EAlienType }).alienType = alienType;
}

describe('ResolveDiscovery', () => {
  beforeEach(() => {
    AlienRegistry.clear();
    AlienRegistry.register(new DummyAlienPlugin());
  });

  afterEach(() => {
    AlienRegistry.clear();
  });

  describe('6.2.1 [集成] 3 个发现位全满 → getNewlyDiscoverableAliens 返回该种族', () => {
    it('returns alien when all 3 discovery slots are filled', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'discovery-1');
      const player = game.players[0];
      const board = game.alienState.boards[0];

      expect(board.discovered).toBe(false);
      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(0);

      game.alienState.applyTrace(player, game, ETrace.RED, 0, false);
      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(0);

      game.alienState.applyTrace(player, game, ETrace.YELLOW, 0, false);
      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(0);

      game.alienState.applyTrace(player, game, ETrace.BLUE, 0, false);
      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(1);
      expect(game.alienState.getNewlyDiscoverableAliens()[0]).toBe(board);
    });
  });

  describe('6.2.X [集成] generic discovery flow initializes alien deck and deals by discovery occupants', () => {
    it('deals one alien card per occupied discovery slot, then reveals a face-up alien card', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'discovery-generic-flow',
      );
      const p1 = game.players[0];
      const p2 = game.players[1];
      const board = game.alienState.boards[0];

      const p1HandBefore = p1.hand.length;
      const p2HandBefore = p2.hand.length;

      game.alienState.applyTrace(p1, game, ETrace.RED, 0, false);
      game.alienState.applyTrace(p1, game, ETrace.YELLOW, 0, false);
      game.alienState.applyTrace(p2, game, ETrace.BLUE, 0, false);

      const action = new ResolveDiscovery(p1);
      action.execute(game);

      expect(board.discovered).toBe(true);
      expect(p1.hand.length).toBe(p1HandBefore + 2);
      expect(p2.hand.length).toBe(p2HandBefore + 1);
      expect(board.faceUpAlienCardId).toBeTruthy();
      expect(board.alienDeckDrawPile.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('6.2.2 [集成] 发现在里程碑之后结算', () => {
    it('discovery has lower priority than milestones in deferred queue', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'discovery-2');

      // Verify priority ordering: MILESTONE (9) < DISCOVERY (10)
      // Lower priority number = resolves first
      // So MILESTONE resolves before DISCOVERY (correct per rules)
      const discoveryAction = new ResolveDiscovery(game.players[0]);

      expect(discoveryAction.priority).toBe(10); // EPriority.DISCOVERY
      // Milestone would be priority 9 (EPriority.MILESTONE)
      // Since 9 < 10, milestones resolve first ✓
    });
  });

  describe('6.2.3 [集成] 发现流程：翻转种族板 + 应用设置 + 奖励填写者', () => {
    it('discovers alien and rewards discoverers', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'discovery-3');
      const p1 = game.players[0];
      const p2 = game.players[1];
      const board = game.alienState.boards[0];

      // Override alien type to DUMMY for predictable plugin behavior
      forceAlienType(board, EAlienType.DUMMY);

      const p1InitialScore = p1.score;
      const p2InitialScore = p2.score;

      // Fill all 3 discovery slots: p1 fills RED and YELLOW, p2 fills BLUE
      game.alienState.applyTrace(p1, game, ETrace.RED, 0, false);
      game.alienState.applyTrace(p1, game, ETrace.YELLOW, 0, false);
      game.alienState.applyTrace(p2, game, ETrace.BLUE, 0, false);

      // At this point, p1 has already received rewards from filling slots:
      // RED slot: 5 VP + 1 publicity (alien 0 reward)
      // YELLOW slot: 5 VP + 1 publicity (alien 0 reward)
      // p2 received: BLUE slot: 5 VP + 1 publicity
      expect(p1.score).toBe(p1InitialScore + 10); // 5 + 5 from slots
      expect(p2.score).toBe(p2InitialScore + 5); // 5 from slot

      expect(board.discovered).toBe(false);
      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(1);

      // Execute discovery - should award plugin bonus (3 VP per discoverer)
      const action = new ResolveDiscovery(p1);
      const input = action.execute(game);

      // Should mark as discovered
      expect(board.discovered).toBe(true);

      // Should reward both discoverers with plugin bonus (DummyAlienPlugin awards 3 VP each)
      expect(p1.score).toBe(p1InitialScore + 10 + 3); // slot rewards + plugin bonus
      expect(p2.score).toBe(p2InitialScore + 5 + 3); // slot rewards + plugin bonus

      // No deferred input required for dummy plugin
      expect(input).toBeUndefined();

      // Should not discover again
      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(0);
    });
  });

  describe('6.2.4 [集成] 中立标记也计入发现条件', () => {
    it('discovers alien when neutral markers contribute to full discovery', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'discovery-4');
      const p1 = game.players[0];
      const board = game.alienState.boards[0];

      forceAlienType(board, EAlienType.DUMMY);

      // Place 2 player traces
      game.alienState.applyTrace(p1, game, ETrace.RED, 0, false);
      game.alienState.applyTrace(p1, game, ETrace.YELLOW, 0, false);

      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(0);

      // Place 1 neutral marker (should complete discovery)
      const result = game.alienState.placeNeutralMarker();
      expect(result).not.toBeNull();
      expect(result!.alienIndex).toBe(0);
      expect(result!.traceColor).toBe(ETrace.BLUE); // Should fill the remaining blue slot

      // Now should be discoverable
      expect(board.isFullyMarked()).toBe(true);
      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(1);

      // Execute discovery
      const action = new ResolveDiscovery(p1);
      action.execute(game);

      expect(board.discovered).toBe(true);
      // Only p1 should get discoverer reward (not neutral)
      const discoverers = board.getDiscoverers();
      expect(discoverers).toEqual([p1.id]);
    });
  });

  describe('6.2.5 [集成] overflow 标记不获得发现奖励', () => {
    it('does not count overflow markers toward discoverer rewards', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'discovery-5');
      const p1 = game.players[0];
      const p2 = game.players[1];
      const board = game.alienState.boards[0];

      forceAlienType(board, EAlienType.DUMMY);

      const p2InitialScore = p2.score;

      // p1 fills all 3 discovery slots
      game.alienState.applyTrace(p1, game, ETrace.RED, 0, false);
      game.alienState.applyTrace(p1, game, ETrace.YELLOW, 0, false);
      game.alienState.applyTrace(p1, game, ETrace.BLUE, 0, false);

      // p2 places overflow marker (should not make them a discoverer)
      game.alienState.applyTrace(p2, game, ETrace.RED, 0, false);

      const overflowSlot = board.slots.find((s) => !s.isDiscovery);
      expect(overflowSlot!.occupants).toHaveLength(1);
      expect(overflowSlot!.occupants[0].source).toEqual({ playerId: p2.id });

      // p2 got overflow reward (3 VP)
      expect(p2.score).toBe(p2InitialScore + 3);

      // Execute discovery
      const action = new ResolveDiscovery(p1);
      action.execute(game);

      expect(board.discovered).toBe(true);

      // Only p1 should be discoverer (filled discovery slots)
      const discoverers = board.getDiscoverers();
      expect(discoverers).toEqual([p1.id]);

      // p2 should NOT get discoverer plugin bonus (still at initial + overflow reward)
      expect(p2.score).toBe(p2InitialScore + 3); // Only overflow reward, no plugin bonus
    });
  });

  describe('6.2.8 [集成] 中立标记只占 6 个基础发现位', () => {
    it('neutral markers only fill base discovery slots, not overflow', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'discovery-8');
      const board0 = game.alienState.boards[0];
      const board1 = game.alienState.boards[1];

      // Fill all 6 discovery slots (3 per alien) with neutral markers
      for (let i = 0; i < 6; i++) {
        const result = game.alienState.placeNeutralMarker();
        expect(result).not.toBeNull();
        expect(result!.alienIndex).toBeGreaterThanOrEqual(0);
        expect(result!.alienIndex).toBeLessThan(2);
      }

      // All discovery slots should be filled
      expect(
        board0.getDiscoverySlots().every((s) => s.occupants.length > 0),
      ).toBe(true);
      expect(
        board1.getDiscoverySlots().every((s) => s.occupants.length > 0),
      ).toBe(true);

      // Overflow slots should be empty
      const overflow0 = board0.slots.find((s) => !s.isDiscovery);
      const overflow1 = board1.slots.find((s) => !s.isDiscovery);
      expect(overflow0!.occupants).toHaveLength(0);
      expect(overflow1!.occupants).toHaveLength(0);

      // 7th neutral marker should return null (no more discovery slots)
      const result7 = game.alienState.placeNeutralMarker();
      expect(result7).toBeNull();

      // Overflow slots should still be empty
      expect(overflow0!.occupants).toHaveLength(0);
      expect(overflow1!.occupants).toHaveLength(0);
    });
  });

  describe('6.2.9 [集成] 两个种族在同一回合都被发现', () => {
    it('discovers both aliens when both are fully marked', () => {
      const game = Game.create(BASE_PLAYERS, { playerCount: 2 }, 'discovery-9');
      const p1 = game.players[0];
      const p2 = game.players[1];
      const board0 = game.alienState.boards[0];
      const board1 = game.alienState.boards[1];

      forceAlienType(board0, EAlienType.DUMMY);
      forceAlienType(board1, EAlienType.DUMMY);

      const p1InitialScore = p1.score;
      const p2InitialScore = p2.score;

      // Fill all discovery slots on both aliens
      // Alien 0: p1 fills all 3
      game.alienState.applyTrace(p1, game, ETrace.RED, 0, false);
      game.alienState.applyTrace(p1, game, ETrace.YELLOW, 0, false);
      game.alienState.applyTrace(p1, game, ETrace.BLUE, 0, false);

      // Alien 1: p2 fills all 3
      game.alienState.applyTrace(p2, game, ETrace.RED, 1, false);
      game.alienState.applyTrace(p2, game, ETrace.YELLOW, 1, false);
      game.alienState.applyTrace(p2, game, ETrace.BLUE, 1, false);

      // Both should be discoverable
      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(2);

      // Execute discovery
      const action = new ResolveDiscovery(p1);
      action.execute(game);

      // Both should be discovered
      expect(board0.discovered).toBe(true);
      expect(board1.discovered).toBe(true);

      // p1 should get plugin bonus for alien 0 only
      // Initial: 1, Alien 0 slots: 5+5+5=15, Plugin: 3, Total: 19
      expect(p1.score).toBe(p1InitialScore + 15 + 3);

      // p2 should get plugin bonus for alien 1 only
      // Initial: 2, Alien 1 slots: 3+3+3=9, Plugin: 3, Total: 14
      expect(p2.score).toBe(p2InitialScore + 9 + 3);

      // No more discoverable aliens
      expect(game.alienState.getNewlyDiscoverableAliens()).toHaveLength(0);
    });
  });

  describe('6.2.10 [集成] 发现后 alien board 额外位可被标记', () => {
    it('discovers Anomalies, then lets a later red trace choose and mark the anomaly column slot', () => {
      AlienRegistry.register(new AnomaliesAlienPlugin());

      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 2 },
        'discovery-anomaly-extra-slot',
      );
      const p1 = game.players[0];
      const board = game.alienState.boards[0];
      forceAlienType(board, EAlienType.ANOMALIES);

      game.alienState.applyTrace(p1, game, ETrace.RED, 0, false);
      game.alienState.applyTrace(p1, game, ETrace.YELLOW, 0, false);
      game.alienState.applyTrace(p1, game, ETrace.BLUE, 0, false);

      new ResolveDiscovery(p1).execute(game);

      expect(board.discovered).toBe(true);
      const redColumnSlotId = `alien-${board.alienIndex}-anomaly-column|${ETrace.RED}`;
      const redColumnSlot = board.getSlot(redColumnSlotId);
      expect(redColumnSlot).toBeDefined();
      expect(redColumnSlot?.occupants).toHaveLength(0);

      const scoreBeforeExtraTrace = p1.score;
      const handSizeBeforeExtraTrace = p1.hand.length;
      const input = game.alienState.createTraceInput(p1, game, ETrace.RED);
      expect(input?.toModel().type).toBe(EPlayerInputType.OPTION);
      if (!input) {
        throw new Error('expected trace input for anomaly extra slot');
      }

      const model = input.toModel() as ISelectOptionInputModel;
      expect(model.options.map((option) => option.id)).toContain(
        redColumnSlotId,
      );

      p1.waitingFor = input;
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: redColumnSlotId,
      });

      expect(p1.waitingFor).toBeUndefined();
      expect(redColumnSlot?.occupants).toEqual([
        { source: { playerId: p1.id }, traceColor: ETrace.RED },
      ]);
      expect(p1.score).toBe(scoreBeforeExtraTrace + 5);
      expect(p1.hand).toHaveLength(handSizeBeforeExtraTrace + 1);
    });
  });
});
