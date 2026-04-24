import {
  ETechBonusType,
  ETechId,
  FIRST_TAKE_VP_BONUS,
  type ITechBonusToken,
} from '@seti/common/types/tech';
import { vi } from 'vitest';
import { ResearchTechAction } from '@/engine/actions/ResearchTech.js';
import type { Deck } from '@/engine/deck/Deck.js';
import { ResearchTechEffect } from '@/engine/effects/tech/ResearchTechEffect.js';
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
      drawWithReshuffle(): string | undefined {
        return deckCards.shift();
      },
    } as unknown as Deck<string>,
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
    lockCurrentTurn: vi.fn(),
  } as unknown as IGame;
}

/**
 * The next tile taken from `techId` is `stack.tiles[0]` (see TechBoard.take).
 * Forces a known printed bonus for integration tests without calling TechBonusEffect in isolation.
 */
function setNextTileBonus(
  board: TechBoard,
  techId: ETechId,
  bonus: ITechBonusToken,
): void {
  setNextTileBonuses(board, techId, [bonus]);
}

function setNextTileBonuses(
  board: TechBoard,
  techId: ETechId,
  bonuses: ITechBonusToken[],
): void {
  const stack = board.getStack(techId);
  const tile = stack?.tiles[0];
  if (!tile) {
    throw new Error(`no next tile for ${techId}`);
  }
  tile.bonus = bonuses[0];
  (tile as typeof tile & { bonuses: ITechBonusToken[] }).bonuses = bonuses;
}

function getFirstAvailableTechId(board: TechBoard, playerId: string): ETechId {
  const techId = board.getAvailableTechs(playerId)[0];
  if (!techId) {
    throw new Error(`expected an available tech for player ${playerId}`);
  }
  return techId;
}

describe('Phase 8.4.1 — integration: printed bonus via ResearchTechEffect.acquireTech', () => {
  it('ENERGY: +1 energy (pipeline, not TechBonusEffect alone)', () => {
    const board = new TechBoard(new SeededRandom('p841-energy'));
    setNextTileBonus(board, ETechId.PROBE_DOUBLE_PROBE, {
      type: ETechBonusType.ENERGY,
    });
    const player = createTestPlayer();
    const game = createMockGame(board);
    const before = player.resources.energy;
    const scoreBefore = player.score;

    ResearchTechEffect.acquireTech(player, game, ETechId.PROBE_DOUBLE_PROBE);

    expect(player.resources.energy).toBe(before + 1);
    expect(player.score).toBe(scoreBefore + FIRST_TAKE_VP_BONUS);
  });

  it('DATA: +1 data in pool', () => {
    const board = new TechBoard(new SeededRandom('p841-data'));
    setNextTileBonus(board, ETechId.PROBE_ASTEROID, {
      type: ETechBonusType.DATA,
    });
    const player = createTestPlayer();
    const game = createMockGame(board);
    const before = player.resources.data;

    ResearchTechEffect.acquireTech(player, game, ETechId.PROBE_ASTEROID);

    expect(player.resources.data).toBe(before + 1);
  });

  it('DATA_2: +2 data in pool', () => {
    const board = new TechBoard(new SeededRandom('p841-data2'));
    setNextTileBonus(board, ETechId.PROBE_ROVER_DISCOUNT, {
      type: ETechBonusType.DATA_2,
    });
    const player = createTestPlayer();
    const game = createMockGame(board);
    const before = player.resources.data;

    ResearchTechEffect.acquireTech(player, game, ETechId.PROBE_ROVER_DISCOUNT);

    expect(player.resources.data).toBe(before + 2);
  });

  it('PUBLICITY: +1 publicity', () => {
    const board = new TechBoard(new SeededRandom('p841-pub'));
    setNextTileBonus(board, ETechId.PROBE_MOON, {
      type: ETechBonusType.PUBLICITY,
    });
    const player = createTestPlayer({
      resources: { credits: 10, energy: 10, publicity: 5 },
    });
    const game = createMockGame(board);
    const before = player.resources.publicity;

    ResearchTechEffect.acquireTech(player, game, ETechId.PROBE_MOON);

    expect(player.resources.publicity).toBe(before + 1);
  });

  it('CARD: draws from mainDeck through acquireTech', () => {
    const board = new TechBoard(new SeededRandom('p841-card'));
    setNextTileBonus(board, ETechId.SCAN_EARTH_LOOK, {
      type: ETechBonusType.CARD,
    });
    const player = createTestPlayer();
    const game = createMockGame(board, ['bonus-card']);
    const before = player.hand.length;

    ResearchTechEffect.acquireTech(player, game, ETechId.SCAN_EARTH_LOOK);

    expect(player.hand.length).toBe(before + 1);
    expect(player.hand).toContain('bonus-card');
  });

  it('CREDIT: +1 credit', () => {
    const board = new TechBoard(new SeededRandom('p841-credit'));
    setNextTileBonus(board, ETechId.SCAN_POP_SIGNAL, {
      type: ETechBonusType.CREDIT,
    });
    const player = createTestPlayer();
    const game = createMockGame(board);
    const before = player.resources.credits;

    ResearchTechEffect.acquireTech(player, game, ETechId.SCAN_POP_SIGNAL);

    expect(player.resources.credits).toBe(before + 1);
  });

  it('VP_2: +2 VP from tile (plus first-take VP)', () => {
    const board = new TechBoard(new SeededRandom('p841-vp2'));
    setNextTileBonus(board, ETechId.SCAN_HAND_SIGNAL, {
      type: ETechBonusType.VP_2,
    });
    const player = createTestPlayer();
    const game = createMockGame(board);
    const scoreBefore = player.score;

    ResearchTechEffect.acquireTech(player, game, ETechId.SCAN_HAND_SIGNAL);

    expect(player.score).toBe(scoreBefore + FIRST_TAKE_VP_BONUS + 2);
  });

  it('VP_3: +3 VP from tile (plus first-take VP)', () => {
    const board = new TechBoard(new SeededRandom('p841-vp3'));
    setNextTileBonus(board, ETechId.SCAN_ENERGY_LAUNCH, {
      type: ETechBonusType.VP_3,
    });
    const player = createTestPlayer();
    const game = createMockGame(board);
    const scoreBefore = player.score;

    ResearchTechEffect.acquireTech(player, game, ETechId.SCAN_ENERGY_LAUNCH);

    expect(player.score).toBe(scoreBefore + FIRST_TAKE_VP_BONUS + 3);
  });

  it('LAUNCH_IGNORE_LIMIT: launches a probe for free after the launch-limit tech is gained', () => {
    const board = new TechBoard(new SeededRandom('p841-launch'));
    setNextTileBonuses(board, ETechId.PROBE_DOUBLE_PROBE, [
      { type: ETechBonusType.ENERGY },
      {
        type: ETechBonusType.LAUNCH_IGNORE_LIMIT,
      },
    ]);
    const player = createTestPlayer();
    player.probesInSpace = 1;
    const game = createMockGame(board);
    const solarSystem = {
      getSpacesOnPlanet: vi.fn(() => [{ id: 'earth-space' }]),
      placeProbe: vi.fn(() => ({ id: 'probe-1', playerId: player.id })),
    };
    game.solarSystem = solarSystem as never;

    ResearchTechEffect.acquireTech(player, game, ETechId.PROBE_DOUBLE_PROBE);

    expect(player.probeSpaceLimit).toBe(1);
    expect(player.probesInSpace).toBe(2);
    expect(solarSystem.placeProbe).toHaveBeenCalledWith(
      player.id,
      'earth-space',
    );
  });

  it('applies every bonus token printed on a tech tile', () => {
    const board = new TechBoard(new SeededRandom('p841-multi-bonus'));
    setNextTileBonuses(board, ETechId.SCAN_EARTH_LOOK, [
      { type: ETechBonusType.ENERGY },
      {
        type: ETechBonusType.DATA_2,
      },
    ]);
    const player = createTestPlayer();
    const game = createMockGame(board);
    const energyBefore = player.resources.energy;
    const dataBefore = player.resources.data;

    const result = ResearchTechEffect.acquireTech(
      player,
      game,
      ETechId.SCAN_EARTH_LOOK,
    );

    expect(player.resources.energy).toBe(energyBefore + 1);
    expect(player.resources.data).toBe(dataBefore + 2);
    expect(result.tileBonuses).toEqual([
      { type: ETechBonusType.ENERGY },
      { type: ETechBonusType.DATA_2 },
    ]);
  });

  it('LAUNCH_IGNORE_LIMIT skips when a probe cannot be launched', () => {
    const board = new TechBoard(new SeededRandom('p841-launch-skip'));
    setNextTileBonus(board, ETechId.COMPUTER_VP_PUBLICITY, {
      type: ETechBonusType.LAUNCH_IGNORE_LIMIT,
    });
    const player = createTestPlayer();
    const game = createMockGame(board);
    const before = player.probesInSpace;

    ResearchTechEffect.acquireTech(player, game, ETechId.COMPUTER_VP_PUBLICITY);

    expect(player.probesInSpace).toBe(before);
  });

  it('card-grant path (ResearchTechAction isCardEffect): still applies printed bonus', () => {
    const board = new TechBoard(new SeededRandom('p841-card-action'));
    setNextTileBonus(board, ETechId.SCAN_POP_SIGNAL, {
      type: ETechBonusType.CREDIT,
    });
    const player = createTestPlayer({
      resources: { credits: 4, energy: 3, publicity: 0 },
    });
    const game = createMockGame(board);
    const creditsBefore = player.resources.credits;

    ResearchTechAction.execute(player, game, true, {
      mode: 'specific',
      techIds: [ETechId.SCAN_POP_SIGNAL],
    });

    expect(player.resources.credits).toBe(creditsBefore + 1);
    expect(player.techs).toContain(ETechId.SCAN_POP_SIGNAL);
  });
});

describe('Phase 8.4.2 — integration: printed bonus before blue-tech column placement', () => {
  it('CARD bonus: card is drawn before computer.placeTech runs', () => {
    const board = new TechBoard(new SeededRandom('p842-card-order'));
    setNextTileBonus(board, ETechId.COMPUTER_VP_CREDIT, {
      type: ETechBonusType.CARD,
    });
    const game = createMockGame(board, ['draw-before-place']);
    const player = createTestPlayer();
    const handBefore = player.hand.length;

    vi.spyOn(player.computer, 'getEligibleTechColumns').mockReturnValue([2]);
    const placeTechImpl = player.computer.placeTech.bind(player.computer);
    const placeSpy = vi
      .spyOn(player.computer, 'placeTech')
      .mockImplementation((columnIndex, placement) => {
        expect(player.hand.length).toBe(handBefore + 1);
        expect(player.hand).toContain('draw-before-place');
        placeTechImpl(columnIndex, placement);
      });

    ResearchTechEffect.execute(player, game, {
      filter: { mode: 'specific', techIds: [ETechId.COMPUTER_VP_CREDIT] },
    });

    expect(placeSpy).toHaveBeenCalled();
  });

  it('ENERGY bonus: energy gained before computer.placeTech runs', () => {
    const board = new TechBoard(new SeededRandom('p842-energy-order'));
    setNextTileBonus(board, ETechId.COMPUTER_VP_ENERGY, {
      type: ETechBonusType.ENERGY,
    });
    const game = createMockGame(board);
    const player = createTestPlayer();
    const energyBefore = player.resources.energy;

    vi.spyOn(player.computer, 'getEligibleTechColumns').mockReturnValue([0]);
    const placeTechImpl = player.computer.placeTech.bind(player.computer);
    const placeSpy = vi
      .spyOn(player.computer, 'placeTech')
      .mockImplementation((columnIndex, placement) => {
        expect(player.resources.energy).toBe(energyBefore + 1);
        placeTechImpl(columnIndex, placement);
      });

    ResearchTechEffect.execute(player, game, {
      filter: { mode: 'specific', techIds: [ETechId.COMPUTER_VP_ENERGY] },
    });

    expect(placeSpy).toHaveBeenCalled();
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
      const tileTypes = stack.tiles.map((tile) => {
        if (!tile.bonus) {
          throw new Error(`expected tile bonus for ${techId}`);
        }
        return tile.bonus.type;
      });
      const poolTypes = pool.map((b) => b.type);
      if (tileTypes.some((t, i) => t !== poolTypes[i])) {
        anyDiffers = true;
        break;
      }
    }
    expect(anyDiffers).toBe(true);
  });
});

describe('ResearchTechEffect.acquireTech — tile metadata', () => {
  it('result includes tileBonus when tile has a bonus', () => {
    const rng = new SeededRandom('acquire-bonus');
    const board = new TechBoard(rng);
    const game = createMockGame(board, ['card-1', 'card-2']);
    const player = createTestPlayer();

    const techId = getFirstAvailableTechId(board, player.id);
    const stack = board.getStack(techId);
    if (!stack) {
      throw new Error(`expected tech stack for ${techId}`);
    }
    const topTile = stack.tiles[0];
    const expectedBonus = topTile.bonus;

    const result = ResearchTechEffect.acquireTech(player, game, techId);

    expect(result.tileBonus).toEqual(expectedBonus);
  });
});
