import {
  EPlanet,
  EResource,
  ESector,
  ETrace,
} from '@seti/common/types/element';
import { ETechId } from '@seti/common/types/tech';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { Game } from '@/engine/Game.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import {
  GoldScoringTile,
  scoreEndGameCard,
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

    it('scores end-game cards per fulfilled sector color', () => {
      const game = createTestGame('g92-endgame-sector-fulfills');
      const p1 = game.players[0];

      const redSector = game.sectors.find(
        (sector) => sector.color === ESector.RED,
      );
      const yellowSector = game.sectors.find(
        (sector) => sector.color === ESector.YELLOW,
      );
      const blueSector = game.sectors.find(
        (sector) => sector.color === ESector.BLUE,
      );
      const blackSector = game.sectors.find(
        (sector) => sector.color === ESector.BLACK,
      );
      if (!redSector || !yellowSector || !blueSector || !blackSector) {
        throw new Error('expected all sector colors in test game');
      }

      redSector.sectorWinners.push('p1', 'p1', 'p2');
      yellowSector.sectorWinners.push('p1');
      blueSector.sectorWinners.push('p1', 'p2');
      blackSector.sectorWinners.push('p2', 'p1', 'p1', 'p1');

      expect(scoreEndGameCard('38', p1, game)).toBe(6);
      expect(scoreEndGameCard('40', p1, game)).toBe(3);
      expect(scoreEndGameCard('42', p1, game)).toBe(3);
      expect(scoreEndGameCard('44', p1, game)).toBe(9);
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

  describe('scoreEndGameCard card-specific Base scoring', () => {
    it.each([
      {
        cardId: '62',
        name: 'Onsala Telescope Construction',
        targetTrace: ETrace.RED,
        ignoredTrace: ETrace.YELLOW,
      },
      {
        cardId: '63',
        name: 'SHERLOC',
        targetTrace: ETrace.YELLOW,
        ignoredTrace: ETrace.BLUE,
      },
      {
        cardId: '68',
        name: 'DUNE',
        targetTrace: ETrace.BLUE,
        ignoredTrace: ETrace.RED,
      },
    ])(
      'scores Base $cardId $name from its printed trace color',
      ({ cardId, targetTrace, ignoredTrace }) => {
        const game = createTestGame(`endgame-${cardId}-trace`);
        const p1 = game.players[0];

        placeTraceForTestSetup(game.alienState, p1, game, targetTrace, 0);
        placeTraceForTestSetup(game.alienState, p1, game, targetTrace, 0);
        placeTraceForTestSetup(game.alienState, p1, game, ignoredTrace, 0);

        expect(scoreEndGameCard(cardId, p1, game)).toBe(4);
      },
    );

    it('scores Base 126 Euclid Telescope Construction from computer techs', () => {
      const game = createTestGame('endgame-126-computer-tech');
      const p1 = game.players[0];
      p1.techs = [
        ETechId.COMPUTER_VP_CREDIT,
        ETechId.COMPUTER_VP_ENERGY,
        ETechId.SCAN_EARTH_LOOK,
        ETechId.PROBE_ASTEROID,
      ];

      expect(scoreEndGameCard('126', p1, game)).toBe(4);
    });

    it('scores Base 12 Europa Clipper per own orbiter or lander at Jupiter including moons', () => {
      const game = createTestGame('endgame-12-jupiter');
      const p1 = game.players[0];
      const jupiter = game.planetaryBoard?.planets.get(EPlanet.JUPITER);
      const mars = game.planetaryBoard?.planets.get(EPlanet.MARS);
      if (!jupiter || !mars) {
        throw new Error('expected planetary board with Jupiter and Mars');
      }

      jupiter.orbitSlots.push({ playerId: 'p1' }, { playerId: 'p2' });
      jupiter.landingSlots.push({ playerId: 'p1' });
      jupiter.moonOccupant = { playerId: 'p1' };
      mars.orbitSlots.push({ playerId: 'p1' });

      expect(scoreEndGameCard('12', p1, game)).toBe(9);
    });

    it('scores Base 14 Mars Science Laboratory per own orbiter or lander at Mars including moons', () => {
      const game = createTestGame('endgame-14-mars');
      const p1 = game.players[0];
      const mars = game.planetaryBoard?.planets.get(EPlanet.MARS);
      const jupiter = game.planetaryBoard?.planets.get(EPlanet.JUPITER);
      if (!mars || !jupiter) {
        throw new Error('expected planetary board with Mars and Jupiter');
      }

      mars.orbitSlots.push({ playerId: 'p1' });
      mars.landingSlots.push({ playerId: 'p1' }, { playerId: 'p2' });
      mars.moonOccupant = { playerId: 'p1' };
      jupiter.orbitSlots.push({ playerId: 'p1' });

      expect(scoreEndGameCard('14', p1, game)).toBe(12);
    });

    it('scores Base 86 Giant Magellan Telescope once per sector with an own signal', () => {
      const game = createTestGame('endgame-86-sector-signals');
      const p1 = game.players[0];
      const [firstSector, secondSector, opponentSector] = game.sectors;
      if (!firstSector || !secondSector || !opponentSector) {
        throw new Error('expected at least three sectors');
      }

      firstSector.markSignal('p1');
      firstSector.markSignal('p1');
      secondSector.markSignal('p1');
      opponentSector.markSignal('p2');

      expect(scoreEndGameCard('86', p1, game)).toBe(2);
    });

    it('scores Base 113 Solvay Conference as the best rightmost slot on a gold tile the player did not mark', () => {
      const game = createTestGame('endgame-113-solvay');
      const p1 = game.players[0];
      p1.completedMissions = Array.from(
        { length: 10 },
        (_, index) => `m${index}`,
      );
      p1.tuckedIncomeCards = [
        { income: EResource.ENERGY },
        { income: EResource.ENERGY },
        { income: EResource.ENERGY },
      ];

      const markedMissionTile = new GoldScoringTile({
        id: 'mission',
        side: 'A',
        slotValues: [9, 7, 5],
      });
      markedMissionTile.claim(p1.id);

      game.goldScoringTiles = [
        markedMissionTile,
        new GoldScoringTile({
          id: 'tech',
          side: 'A',
          slotValues: [8, 6, 4, 2],
        }),
        new GoldScoringTile({
          id: 'income',
          side: 'A',
          slotValues: [8, 6, 4, 3],
        }),
      ];

      expect(scoreEndGameCard('113', p1, game)).toBe(9);
    });

    it('scores Base 113 even when the unmarked tile has no claimable spaces, and scores 0 when all tiles were marked by the player', () => {
      const game = createTestGame('endgame-113-solvay-full-tile');
      const p1 = game.players[0];
      p1.completedMissions = ['m1', 'm2', 'm3', 'm4'];

      const fullUnmarkedMissionTile = new GoldScoringTile({
        id: 'mission',
        side: 'A',
        slotValues: [8, 6],
      });
      fullUnmarkedMissionTile.claim('p2');
      fullUnmarkedMissionTile.claim('p3');

      const markedOtherTile = new GoldScoringTile({
        id: 'other',
        side: 'B',
        slotValues: [5, 4, 3, 2],
      });
      markedOtherTile.claim(p1.id);

      game.goldScoringTiles = [fullUnmarkedMissionTile, markedOtherTile];

      expect(scoreEndGameCard('113', p1, game)).toBe(24);

      fullUnmarkedMissionTile.claims.push({ playerId: p1.id, value: 0 });
      expect(scoreEndGameCard('113', p1, game)).toBe(0);
    });

    it('scores Base 127 NEAR Shoemaker only when the player has a probe on asteroids', () => {
      const game = createTestGame('endgame-127-asteroids');
      const p1 = game.players[0];
      const asteroidSpace = game.solarSystem?.spaces.find((space) =>
        space.elements.some(
          (element) =>
            element.type === ESolarSystemElementType.ASTEROID &&
            element.amount > 0,
        ),
      );
      if (!game.solarSystem || !asteroidSpace) {
        throw new Error('expected solar system with an asteroid space');
      }

      game.solarSystem.placeProbe('p2', asteroidSpace.id);
      expect(scoreEndGameCard('127', p1, game)).toBe(0);

      game.solarSystem.placeProbe('p1', asteroidSpace.id);
      expect(scoreEndGameCard('127', p1, game)).toBe(13);
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
