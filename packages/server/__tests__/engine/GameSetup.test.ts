import { baseCards } from '@seti/common/data/baseCards';
import { EResource } from '@seti/common/types/element';
import { EAlienType, EPhase } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import {
  FIRST_TAKE_VP_BONUS,
  TECH_CATEGORIES,
  TECH_LEVELS,
  TILES_PER_STACK,
} from '@seti/common/types/tech';
import { Game } from '@/engine/Game.js';

const BASE_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
  { id: 'p3', name: 'Cathy', color: 'green', seatIndex: 2 },
  { id: 'p4', name: 'Dylan', color: 'yellow', seatIndex: 3 },
] as const;

describe('GameSetup', () => {
  it('builds initial draw pool from base cards only', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      { playerCount: 2 },
      'seed-base-only',
    );

    const baseCardIdSet = new Set(baseCards.map((card) => card.id));
    const dealtCardIds = [
      ...game.cardRow,
      ...game.endOfRoundStacks.flat(),
      ...game.players.flatMap((player) => [
        ...player.hand,
        ...player.tuckedIncomeCards,
      ]),
    ];

    for (const cardId of dealtCardIds) {
      expect(baseCardIdSet.has(cardId as string)).toBe(true);
    }
  });

  it('initializes 2-player setup values', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      { playerCount: 2 },
      'seed-2p',
    );

    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.hiddenAliens).toHaveLength(2);
    expect(game.cardRow).toHaveLength(3);
    expect(game.endOfRoundStacks).toHaveLength(4);
    expect(game.endOfRoundStacks[0]).toHaveLength(3);
    expect(game.neutralMilestones).toEqual([20, 20, 30, 30]);
  });

  it('initializes 3-player and 4-player neutral milestones correctly', () => {
    const game3 = Game.create(
      BASE_PLAYERS.slice(0, 3),
      { playerCount: 3 },
      'seed-3p',
    );
    const game4 = Game.create(BASE_PLAYERS, { playerCount: 4 }, 'seed-4p');

    expect(game3.neutralMilestones).toEqual([20, 30]);
    expect(game4.neutralMilestones).toEqual([]);
  });

  it('assigns player defaults by seat and setup draw, then prompts tuck selection', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      { playerCount: 2 },
      'seed-setup',
    );

    expect(game.players[0].score).toBe(1);
    expect(game.players[1].score).toBe(2);
    expect(game.players[0].publicity).toBe(4);
    expect(game.players[0].resources.toObject()).toEqual({
      credits: 4,
      energy: 3,
      publicity: 4,
      data: 0,
    });
    expect(game.players[0].hand).toHaveLength(5);
    expect(game.players[0].tuckedIncomeCards).toHaveLength(0);
    const tuckedIncome = game.players[0].income.tuckedCardIncome;
    const totalTuckedIncome = Object.values(tuckedIncome).reduce(
      (sum, value) => sum + value,
      0,
    );
    expect(totalTuckedIncome).toBe(0);
    expect(game.players[0].waitingFor?.toModel().type).toBe(
      EPlayerInputType.CARD,
    );
  });

  describe('shared board details', () => {
    it('1.1.1 builds exactly 8 sectors with unique sector ids', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-sectors',
      );

      expect(game.sectors).toHaveLength(8);
      const sectorIds = new Set(game.sectors.map((sector) => sector.id));
      expect(sectorIds.size).toBe(8);
      for (const sector of game.sectors) {
        expect(sector.dataSlotCapacity).toBeGreaterThanOrEqual(1);
        expect(sector.signals.length).toBe(sector.dataSlotCapacity);
        expect(sector.signals.every((s) => s.type === 'data')).toBe(true);
      }
    });

    it('1.1.2 hides exactly 2 distinct alien species from the non-DUMMY pool', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-aliens',
      );

      expect(game.hiddenAliens).toHaveLength(2);
      expect(new Set(game.hiddenAliens).size).toBe(2);
      expect(game.hiddenAliens).not.toContain(EAlienType.DUMMY);
    });

    it('1.1.2E selects random hidden aliens from enabled alien module pool', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        {
          playerCount: 2,
          alienModulesEnabled: [true, false, true, false, false],
        },
        'seed-aliens-enabled-pool',
      );

      expect(game.hiddenAliens).toHaveLength(2);
      expect(new Set(game.hiddenAliens)).toEqual(
        new Set([EAlienType.ANOMALIES, EAlienType.EXERTIANS]),
      );
    });

    it('1.1.3 shuffles main deck and reveals exactly 3 cards to card row', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-card-row',
      );

      expect(game.cardRow).toHaveLength(3);
      const cardRowIds = new Set(game.cardRow);
      expect(cardRowIds.size).toBe(3);
      for (const cardId of game.cardRow) {
        expect(typeof cardId).toBe('string');
        if (typeof cardId === 'string') {
          expect(cardId.length).toBeGreaterThan(0);
        }
      }
    });

    it('1.1.4 fills each nearby star data slot completely with data tokens', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-data-slots',
      );

      expect(game.sectors).toHaveLength(8);
      for (const sector of game.sectors) {
        const dataCount = sector.signals.filter(
          (s) => s.type === 'data',
        ).length;
        expect(dataCount).toBe(sector.dataSlotCapacity);
        expect(sector.signals).toHaveLength(sector.dataSlotCapacity);
      }
    });

    it('1.1.7 builds 12 tech stacks, each with 4 tiles and a first-take VP bonus', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-tech',
      );

      if (game.techBoard === null) {
        throw new Error('Expected tech board to be initialized');
      }

      const expectedStackCount = TECH_CATEGORIES.length * TECH_LEVELS.length;
      expect(expectedStackCount).toBe(12);
      expect(game.techBoard.stacks.size).toBe(expectedStackCount);

      for (const stack of game.techBoard.stacks.values()) {
        expect(stack.tiles).toHaveLength(TILES_PER_STACK);
        expect(stack.firstTakeBonusAvailable).toBe(true);
      }
      expect(FIRST_TAKE_VP_BONUS).toBe(2);
    });

    it('1.1.8 builds 4 end-of-round stacks of size (playerCount + 1)', () => {
      const game2 = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-eor-2p',
      );
      const game3 = Game.create(
        BASE_PLAYERS.slice(0, 3),
        { playerCount: 3 },
        'seed-eor-3p',
      );
      const game4 = Game.create(
        BASE_PLAYERS,
        { playerCount: 4 },
        'seed-eor-4p',
      );

      for (const [game, expectedLen] of [
        [game2, 3],
        [game3, 4],
        [game4, 5],
      ] as const) {
        expect(game.endOfRoundStacks).toHaveLength(4);
        for (const stack of game.endOfRoundStacks) {
          expect(stack).toHaveLength(expectedLen);
        }
      }
    });

    it('1.1.9 starts with roundRotationReminderIndex at 0', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-rotation-reminder',
      );

      expect(game.roundRotationReminderIndex).toBe(0);
    });

    it('1.1.5 builds 4 gold scoring tiles with a randomly chosen A/B side', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-gold',
      );

      expect(game.goldScoringTiles).toHaveLength(4);
      for (const tile of game.goldScoringTiles) {
        expect(['A', 'B']).toContain(tile.side);
      }
    });

    it('1.2.4 assigns seat-order scores for 3- and 4-player games', () => {
      const game3 = Game.create(
        BASE_PLAYERS.slice(0, 3),
        { playerCount: 3 },
        'seed-scores-3p',
      );
      const game4 = Game.create(
        BASE_PLAYERS,
        { playerCount: 4 },
        'seed-scores-4p',
      );

      expect(game3.players.map((p) => p.score)).toEqual([1, 2, 3]);
      expect(game4.players.map((p) => p.score)).toEqual([1, 2, 3, 4]);
    });

    it('1.2.5 starting base income provides 3 credits, 2 energy, and 1 card per round', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-base-income',
      );

      for (const player of game.players) {
        const baseIncome = player.income.baseIncome;
        expect(baseIncome[EResource.CREDIT]).toBe(3);
        expect(baseIncome[EResource.ENERGY]).toBe(2);
        expect(baseIncome[EResource.CARD]).toBe(1);
      }
    });

    it('1.2.6 every player starts with publicity at 4', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-publicity',
      );

      for (const player of game.players) {
        expect(player.publicity).toBe(4);
      }
    });
  });
});
