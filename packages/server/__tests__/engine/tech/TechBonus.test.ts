import {
  ETechBonusType,
  type ETechId,
  type ITechBonusToken,
} from '@seti/common/types/tech';
import type { Deck } from '@/engine/deck/Deck.js';
import { ResearchTechEffect } from '@/engine/effects/tech/ResearchTechEffect.js';
import { TechBonusEffect } from '@/engine/effects/tech/TechBonusEffect.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { TechBoard } from '@/engine/tech/TechBoard.js';
import { TECH_BONUS_POOLS } from '@/engine/tech/TechBonusConfig.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createTestPlayer(
  overrides?: Partial<ConstructorParameters<typeof Player>[0]>,
): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 10, energy: 10, publicity: 10 },
    ...overrides,
  });
}

function createMockGame(
  techBoard?: TechBoard | null,
  deckCards: string[] = [],
): IGame {
  const board =
    techBoard === undefined
      ? new TechBoard(new SeededRandom('tech-board'))
      : techBoard;
  return {
    techBoard: board,
    mainDeck: {
      drawN(count: number): string[] {
        return deckCards.splice(0, count);
      },
    } as Deck<string>,
    solarSystem: null,
    planetaryBoard: null,
    sectors: [],
    cardRow: [],
    endOfRoundStacks: [],
    hiddenAliens: [],
    neutralMilestones: [],
    roundRotationReminderIndex: 0,
    hasRoundFirstPassOccurred: false,
    rotationCounter: 0,
  } as unknown as IGame;
}

describe('TechBonusEffect.apply', () => {
  it('ENERGY: grants +1 energy', () => {
    const player = createTestPlayer();
    const before = player.resources.energy;
    TechBonusEffect.apply(player, createMockGame(), {
      type: ETechBonusType.ENERGY,
    });
    expect(player.resources.energy).toBe(before + 1);
  });

  it('DATA: grants +1 data (to pool)', () => {
    const player = createTestPlayer();
    const before = player.data.poolCount;
    TechBonusEffect.apply(player, createMockGame(), {
      type: ETechBonusType.DATA,
    });
    expect(player.data.poolCount).toBe(before + 1);
  });

  it('DATA_2: grants +2 data (to pool)', () => {
    const player = createTestPlayer();
    const before = player.data.poolCount;
    TechBonusEffect.apply(player, createMockGame(), {
      type: ETechBonusType.DATA_2,
    });
    expect(player.data.poolCount).toBe(before + 2);
  });

  it('PUBLICITY: grants +1 publicity', () => {
    const player = createTestPlayer({
      resources: { credits: 10, energy: 10, publicity: 5 },
    });
    const before = player.resources.publicity;
    TechBonusEffect.apply(player, createMockGame(), {
      type: ETechBonusType.PUBLICITY,
    });
    expect(player.resources.publicity).toBe(before + 1);
  });

  it('CARD: draws 1 card', () => {
    const player = createTestPlayer();
    const game = createMockGame(null, ['bonus-card']);
    const before = player.hand.length;
    TechBonusEffect.apply(player, game, { type: ETechBonusType.CARD });
    expect(player.hand.length).toBe(before + 1);
    expect(player.hand).toContain('bonus-card');
  });

  it('CREDIT: grants +1 credit', () => {
    const player = createTestPlayer();
    const before = player.resources.credits;
    TechBonusEffect.apply(player, createMockGame(), {
      type: ETechBonusType.CREDIT,
    });
    expect(player.resources.credits).toBe(before + 1);
  });

  it('VP_2: grants +2 VP', () => {
    const player = createTestPlayer();
    const before = player.score;
    TechBonusEffect.apply(player, createMockGame(), {
      type: ETechBonusType.VP_2,
    });
    expect(player.score).toBe(before + 2);
  });

  it('VP_3: grants +3 VP', () => {
    const player = createTestPlayer();
    const before = player.score;
    TechBonusEffect.apply(player, createMockGame(), {
      type: ETechBonusType.VP_3,
    });
    expect(player.score).toBe(before + 3);
  });

  it('LAUNCH_IGNORE_LIMIT: increases probe space limit by 1', () => {
    const player = createTestPlayer();
    const before = player.probeSpaceLimit;
    TechBonusEffect.apply(player, createMockGame(), {
      type: ETechBonusType.LAUNCH_IGNORE_LIMIT,
    });
    expect(player.probeSpaceLimit).toBe(before + 1);
  });

  it('returns applied: true with the bonus', () => {
    const player = createTestPlayer();
    const bonus: ITechBonusToken = { type: ETechBonusType.ENERGY };
    const result = TechBonusEffect.apply(player, createMockGame(), bonus);
    expect(result.applied).toBe(true);
    expect(result.bonus).toBe(bonus);
  });
});

describe('TechBoard bonus assignment', () => {
  it('assigns bonus tokens from TECH_BONUS_POOLS to tiles', () => {
    const rng = new SeededRandom('bonus-test');
    const board = new TechBoard(rng);

    for (const [techId, stack] of board.stacks) {
      const pool = TECH_BONUS_POOLS[techId];
      if (!pool) continue;

      const stackBonusTypes = stack.tiles
        .map((t) => t.bonus?.type)
        .filter(Boolean)
        .sort();
      const poolTypes = pool.map((b) => b.type).sort();
      expect(stackBonusTypes).toEqual(poolTypes);
    }
  });

  it('every tile in every stack has a bonus', () => {
    const rng = new SeededRandom('bonus-check');
    const board = new TechBoard(rng);

    for (const [, stack] of board.stacks) {
      for (const tile of stack.tiles) {
        expect(tile.bonus).toBeDefined();
      }
    }
  });

  it('bonus order differs from pool order due to shuffle', () => {
    const rng = new SeededRandom('bonus-shuffle');
    const board = new TechBoard(rng);

    let anyDiffers = false;
    for (const [techId, stack] of board.stacks) {
      const pool = TECH_BONUS_POOLS[techId];
      if (!pool) continue;
      const tileTypes = stack.tiles.map((t) => t.bonus!.type);
      const poolTypes = pool.map((b) => b.type);
      if (tileTypes.some((t, i) => t !== poolTypes[i])) {
        anyDiffers = true;
        break;
      }
    }
    expect(anyDiffers).toBe(true);
  });
});

describe('ResearchTechEffect.acquireTech with bonus', () => {
  it('result includes tileBonus when tile has a bonus', () => {
    const rng = new SeededRandom('acquire-bonus');
    const board = new TechBoard(rng);
    const game = createMockGame(board, ['card-1', 'card-2']);
    const player = createTestPlayer();

    const techId = board.getAvailableTechs(player.id)[0]!;
    const topTile = board.getStack(techId)!.tiles[0];
    const expectedBonus = topTile.bonus;

    const result = ResearchTechEffect.acquireTech(player, game, techId);

    expect(result.tileBonus).toEqual(expectedBonus);
  });

  it('applies the tile bonus to the player', () => {
    const rng = new SeededRandom('apply-bonus');
    const board = new TechBoard(rng);

    const techId = findTechWithBonusType(board, ETechBonusType.ENERGY);
    if (!techId) return;

    const game = createMockGame(board);
    const player = createTestPlayer();
    const energyBefore = player.resources.energy;

    ResearchTechEffect.acquireTech(player, game, techId);

    expect(player.resources.energy).toBe(energyBefore + 1);
  });

  it('applies VP bonus from tile on top of first-take bonus', () => {
    const rng = new SeededRandom('vp-bonus');
    const board = new TechBoard(rng);

    const techId = findTechWithBonusType(board, ETechBonusType.VP_2);
    if (!techId) return;

    const game = createMockGame(board);
    const player = createTestPlayer();
    const scoreBefore = player.score;

    const result = ResearchTechEffect.acquireTech(player, game, techId);

    const expectedGain = result.vpBonus + 2;
    expect(player.score).toBe(scoreBefore + expectedGain);
  });

  it('applies CARD bonus by drawing from deck', () => {
    const rng = new SeededRandom('card-bonus');
    const board = new TechBoard(rng);

    const techId = findTechWithBonusType(board, ETechBonusType.CARD);
    if (!techId) return;

    const game = createMockGame(board, ['bonus-draw-card']);
    const player = createTestPlayer();
    const handBefore = player.hand.length;

    ResearchTechEffect.acquireTech(player, game, techId);

    expect(player.hand.length).toBe(handBefore + 1);
    expect(player.hand).toContain('bonus-draw-card');
  });
});

function findTechWithBonusType(
  board: TechBoard,
  bonusType: ETechBonusType,
): ETechId | undefined {
  for (const [techId, stack] of board.stacks) {
    if (stack.tiles[0]?.bonus?.type === bonusType) {
      return techId;
    }
  }
  return undefined;
}
