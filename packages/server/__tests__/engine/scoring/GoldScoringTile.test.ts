import { EResource, ETrace } from '@seti/common/types/element';
import { ETechId } from '@seti/common/types/tech';
import { Game } from '@/engine/Game.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import {
  GoldScoringTile,
  type TGoldScoringTileId,
} from '@/engine/scoring/GoldScoringTile.js';
import { placeTraceForTestSetup } from '../../helpers/traceTestUtils.js';

const BASE_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createTestGame(seed: string): ReturnType<typeof Game.create> {
  return Game.create(BASE_PLAYERS, { playerCount: 2 }, seed);
}

function tileClaimed(
  id: TGoldScoringTileId,
  side: 'A' | 'B',
  playerId: string,
  slotValue: number,
): GoldScoringTile {
  const tile = new GoldScoringTile({ id, side, slotValues: [slotValue] });
  tile.claim(playerId);
  return tile;
}

describe('GoldScoringTile', () => {
  describe('Phase 9.2: formulas (Game.create + real IGame / IPlayer)', () => {
    it('9.2.1 [集成] 科技 A：min(probe, scan, computer)', () => {
      const game = createTestGame('g92-tech-a');
      const p1 = game.players[0];
      // 2 probe, 3 scan, 1 computer → min = 1
      p1.techs = [
        ETechId.PROBE_DOUBLE_PROBE,
        ETechId.PROBE_ASTEROID,
        ETechId.SCAN_EARTH_LOOK,
        ETechId.SCAN_POP_SIGNAL,
        ETechId.SCAN_HAND_SIGNAL,
        ETechId.COMPUTER_VP_CREDIT,
      ];

      const tile = tileClaimed('tech', 'A', 'p1', 7);
      expect(tile.scorePlayer(p1, game)).toBe(7);
    });

    it('9.2.2 [集成] 科技 B：floor(techs / 2)', () => {
      const game = createTestGame('g92-tech-b');
      const p1 = game.players[0];
      p1.techs = [
        ETechId.PROBE_DOUBLE_PROBE,
        ETechId.SCAN_EARTH_LOOK,
        ETechId.COMPUTER_VP_CREDIT,
        ETechId.PROBE_ASTEROID,
        ETechId.SCAN_POP_SIGNAL,
      ];
      // floor(5/2) = 2
      const tile = tileClaimed('tech', 'B', 'p1', 5);
      expect(tile.scorePlayer(p1, game)).toBe(10);
    });

    it('9.2.3 [集成] 任务 A：完成任务数', () => {
      const game = createTestGame('g92-mission-a');
      const p1 = game.players[0];
      p1.completedMissions = ['m-a', 'm-b', 'm-c', 'm-d'];

      const tile = tileClaimed('mission', 'A', 'p1', 3);
      expect(tile.scorePlayer(p1, game)).toBe(12);
    });

    it('9.2.4 [集成] 任务 B：收入组只计 tucked，不计 base', () => {
      const game = createTestGame('g92-mission-b');
      const p1 = game.players[0];
      p1.income.addBaseIncome(EResource.CREDIT, 99);
      p1.income.addBaseIncome(EResource.ENERGY, 99);
      p1.tuckedIncomeCards = [
        { income: 'credit' },
        { income: 'energy' },
        { income: 'draw-card' },
      ];
      // min(1 credit, 1 energy, 1 card) = 1；base 不参与
      const tile = tileClaimed('mission', 'B', 'p1', 8);
      expect(tile.scorePlayer(p1, game)).toBe(8);
    });

    it('9.2.5 [集成] 收入 A：max(信用 tucked, 能量 tucked)', () => {
      const game = createTestGame('g92-income-a');
      const p1 = game.players[0];
      p1.tuckedIncomeCards = [
        { income: 'credit' },
        { income: 'credit' },
        { income: 'energy' },
        { income: 'energy' },
        { income: 'energy' },
      ];
      // max(2, 3) = 3
      const tile = tileClaimed('income', 'A', 'p1', 4);
      expect(tile.scorePlayer(p1, game)).toBe(12);
    });

    it('9.2.6 [集成] 收入 B：三色生命痕迹 min，overflow 计入 player.traces', () => {
      const game = createTestGame('g92-income-b-overflow');
      const p1 = game.players[0];
      // Red: discovery + overflow → 2；Y/B：各 1（discovery）
      placeTraceForTestSetup(game.alienState, p1, game, ETrace.RED, 0);
      placeTraceForTestSetup(game.alienState, p1, game, ETrace.RED, 0);
      placeTraceForTestSetup(game.alienState, p1, game, ETrace.YELLOW, 0);
      placeTraceForTestSetup(game.alienState, p1, game, ETrace.BLUE, 0);
      expect(p1.traces[ETrace.RED]).toBe(2);
      expect(p1.traces[ETrace.YELLOW]).toBe(1);
      expect(p1.traces[ETrace.BLUE]).toBe(1);

      const tile = tileClaimed('income', 'B', 'p1', 6);
      expect(tile.scorePlayer(p1, game)).toBe(6);
    });

    it('9.2.6b [集成] 收入 B 从 alien board 统计 trace，而不是依赖 player 缓存', () => {
      const game = createTestGame('g92-income-b-board-count');
      const p1 = game.players[0];
      const board = game.alienState.boards[0];

      for (const color of [ETrace.RED, ETrace.YELLOW, ETrace.BLUE]) {
        const slot = board.getSlot(`alien-0-discovery-${color}`);
        if (!slot) throw new Error(`missing discovery slot: ${color}`);
        board.placeTrace(slot, { playerId: p1.id }, color);
      }
      p1.traces = {
        [ETrace.RED]: 0,
        [ETrace.YELLOW]: 0,
        [ETrace.BLUE]: 0,
        [ETrace.ANY]: 0,
      };

      const tile = tileClaimed('income', 'B', 'p1', 6);
      expect(tile.scorePlayer(p1, game)).toBe(6);
    });

    it('9.2.7 [集成] 其他 A：扇区胜利次数与 orbiter/lander 取 min（lander 含月球等）', () => {
      const game = createTestGame('g92-other-a');
      const p1 = game.players[0];
      game.sectors[0].sectorWinners.push('p1', 'p1', 'p2');
      // p1 在该 sector 上 2 次胜场；全 game 累加
      p1.pieces.deploy(EPieceType.ORBITER);
      p1.pieces.deploy(EPieceType.LANDER);
      // min(2 wins, 1 orb + 1 land) = 2
      const tile = tileClaimed('other', 'A', 'p1', 5);
      expect(tile.scorePlayer(p1, game)).toBe(10);
    });

    it('9.2.8 [集成] 其他 B：floor((已完成任务 + 终局计分牌) / 2)', () => {
      const game = createTestGame('g92-other-b');
      const p1 = game.players[0];
      p1.completedMissions = ['a', 'b', 'c'];
      p1.endGameCards = ['eg1', 'eg2'];
      // floor((3+2)/2) = 2
      const tile = tileClaimed('other', 'B', 'p1', 5);
      expect(tile.scorePlayer(p1, game)).toBe(10);
    });

    it('9.2.9 [集成] 同一牌手状态下科技 A/B 两面公式不同且各自正确', () => {
      const game = createTestGame('g92-both-sides');
      const p1 = game.players[0];
      // 每类 2 个 → min = 2；共 6 张 → floor(6/2)=3
      p1.techs = [
        ETechId.PROBE_DOUBLE_PROBE,
        ETechId.PROBE_ASTEROID,
        ETechId.SCAN_EARTH_LOOK,
        ETechId.SCAN_POP_SIGNAL,
        ETechId.COMPUTER_VP_CREDIT,
        ETechId.COMPUTER_VP_ENERGY,
      ];

      const sideA = tileClaimed('tech', 'A', 'p1', 4);
      const sideB = new GoldScoringTile({
        id: 'tech',
        side: 'B',
        slotValues: [4],
      });
      sideB.claim('p1');

      expect(sideA.scorePlayer(p1, game)).toBe(8);
      expect(sideB.scorePlayer(p1, game)).toBe(12);
    });
  });

  it('does not allow claiming same tile twice by same player', () => {
    const tile = new GoldScoringTile({
      id: 'tech',
      side: 'A',
      slotValues: [5, 4],
    });
    expect(tile.claim('p1')).toBe(5);
    expect(tile.claim('p1')).toBe(0);
  });
});
