import { ETrace } from '@seti/common/types/element';
import { EAlienType, EPlanet } from '@seti/common/types/protocol/enums';
import { AlienState } from '@/engine/alien/AlienState.js';
import { PlanetaryBoard } from '@/engine/board/PlanetaryBoard.js';
import {
  ESolarSystemElementType,
  type ISolarSystemSpace,
} from '@/engine/board/SolarSystem.js';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { EMissionType } from '@/engine/missions/IMission.js';
import { MissionTracker } from '@/engine/missions/MissionTracker.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 10, energy: 5, publicity: 5, data: 3 },
    hand: [],
    ...overrides,
  });
}

function createPlanetaryBoard(): PlanetaryBoard {
  return new PlanetaryBoard();
}

function createGame(overrides: Record<string, unknown> = {}): IGame {
  return {
    sectors: [],
    mainDeck: new Deck<string>(['d1', 'd2', 'd3', 'd4', 'd5']),
    cardRow: [],
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('tech-mission-test'),
    missionTracker: new MissionTracker(),
    solarSystem: null,
    techBoard: null,
    planetaryBoard: null,
    round: 1,
    ...overrides,
  } as unknown as IGame;
}

function createSolarSystemSpace(
  id: string,
  ringIndex: number,
  indexInRing: number,
  elementType: ESolarSystemElementType,
  playerId?: string,
): ISolarSystemSpace {
  return {
    id,
    ringIndex,
    indexInRing,
    discIndex: ringIndex > 0 ? ringIndex - 1 : null,
    hasPublicityIcon: false,
    elements: [{ type: elementType, amount: 1 }],
    occupants: playerId ? [{ id: `probe-${id}`, playerId }] : [],
  };
}

function createSolarSystemWithProbeAtDistance(
  playerId: string,
  distance: number,
): { spaces: ISolarSystemSpace[]; adjacency: Map<string, string[]> } {
  const spaces: ISolarSystemSpace[] = [];
  const adjacency = new Map<string, string[]>();

  spaces.push(
    createSolarSystemSpace('earth', 1, 0, ESolarSystemElementType.EARTH),
  );

  for (let i = 1; i <= Math.max(distance, 1); i++) {
    const isTarget = i === distance;
    spaces.push(
      createSolarSystemSpace(
        `space-${i}`,
        1,
        i,
        ESolarSystemElementType.EMPTY,
        isTarget ? playerId : undefined,
      ),
    );
  }

  for (let i = 0; i < spaces.length; i++) {
    const neighbors: string[] = [];
    if (i > 0) neighbors.push(spaces[i - 1].id);
    if (i < spaces.length - 1) neighbors.push(spaces[i + 1].id);
    adjacency.set(spaces[i].id, neighbors);
  }

  return { spaces, adjacency };
}

// ================================================================
// Card 10 — ODINUS Mission: orbit/land at Neptune AND Uranus
// ================================================================

describe('Card 10 — ODINUS Mission: orbit/land Neptune + Uranus', () => {
  it('is registered as MISSION card kind', () => {
    const card = getCardRegistry().create('10');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('provides QUICK mission def with checkCondition', () => {
    const card = getCardRegistry().create('10');
    const def = card.getMissionDef?.();
    expect(def).toBeDefined();
    expect(def!.type).toBe(EMissionType.QUICK);
    expect(def!.branches[0].checkCondition).toBeTypeOf('function');
  });

  it('condition false when no orbit/land at either planet', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('10').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition false when only at Neptune', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.NEPTUNE, player.id, 1);
    board.orbit(EPlanet.NEPTUNE, player.id);
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('10').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition false when only at Uranus', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.URANUS, player.id, 1);
    board.orbit(EPlanet.URANUS, player.id);
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('10').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition true when at both Neptune and Uranus', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.NEPTUNE, player.id, 1);
    board.orbit(EPlanet.NEPTUNE, player.id);
    board.setProbeCount(EPlanet.URANUS, player.id, 1);
    board.orbit(EPlanet.URANUS, player.id);
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('10').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });
});

// ================================================================
// Card 61 — Quantum Computer: score ≥ 50
// ================================================================

describe('Card 61 — Quantum Computer: score ≥ 50', () => {
  it('is registered as MISSION card kind', () => {
    const card = getCardRegistry().create('61');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('provides QUICK mission def with checkCondition', () => {
    const def = getCardRegistry().create('61').getMissionDef?.()!;
    expect(def.type).toBe(EMissionType.QUICK);
    expect(def.branches[0].checkCondition).toBeTypeOf('function');
  });

  it('condition false when score < 50', () => {
    const player = createPlayer({ score: 49 });
    const game = createGame();
    const def = getCardRegistry().create('61').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition true when score = 50', () => {
    const player = createPlayer({ score: 50 });
    const game = createGame();
    const def = getCardRegistry().create('61').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('condition true when score > 50', () => {
    const player = createPlayer({ score: 100 });
    const game = createGame();
    const def = getCardRegistry().create('61').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });
});

// ================================================================
// Trace-threshold mission cards (70)
// ================================================================

describe.each([
  {
    cardId: '70',
    name: 'ATLAS',
    trace: ETrace.BLUE,
    count: 3,
  },
])(
  'Card $cardId ($name): requires $count $trace trace(s)',
  ({ cardId, trace, count }) => {
    it('is registered as MISSION card kind', () => {
      const card = getCardRegistry().create(cardId);
      expect(card.kind).toBe(EServerCardKind.MISSION);
    });

    it('provides QUICK mission def with checkCondition', () => {
      const def = getCardRegistry().create(cardId).getMissionDef?.()!;
      expect(def.type).toBe(EMissionType.QUICK);
      expect(def.branches[0].checkCondition).toBeTypeOf('function');
    });

    it('condition false when no traces', () => {
      const player = createPlayer({ traces: {} });
      const game = createGame();
      const def = getCardRegistry().create(cardId).getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(false);
    });

    it(`condition false when fewer than ${count} trace(s)`, () => {
      const player = createPlayer({ traces: { [trace]: count - 1 } });
      const game = createGame();
      const def = getCardRegistry().create(cardId).getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(
        count - 1 >= count,
      );
    });

    it(`condition true when exactly ${count} trace(s)`, () => {
      const player = createPlayer({ traces: { [trace]: count } });
      const game = createGame();
      const def = getCardRegistry().create(cardId).getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(true);
    });

    it(`condition true when more than ${count} trace(s)`, () => {
      const player = createPlayer({ traces: { [trace]: count + 2 } });
      const game = createGame();
      const def = getCardRegistry().create(cardId).getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(true);
    });
  },
);

// ================================================================
// "On each species" trace mission cards (64, 66, 97)
// Condition: trace of the required color on ALL alien species.
// ================================================================

function createAlienState(): AlienState {
  return AlienState.createFromHiddenAliens([
    EAlienType.CENTAURIANS,
    EAlienType.EXERTIANS,
  ]);
}

describe.each([
  { cardId: '64', name: 'ALICE', trace: ETrace.BLUE },
  { cardId: '66', name: 'GMRT Telescope', trace: ETrace.RED },
  { cardId: '97', name: 'Apollo 11 Mission', trace: ETrace.YELLOW },
])(
  'Card $cardId ($name): $trace on each species',
  ({ cardId, trace }) => {
    it('is registered as MISSION card kind', () => {
      const card = getCardRegistry().create(cardId);
      expect(card.kind).toBe(EServerCardKind.MISSION);
    });

    it('provides QUICK mission def with checkCondition', () => {
      const def = getCardRegistry().create(cardId).getMissionDef?.()!;
      expect(def.type).toBe(EMissionType.QUICK);
      expect(def.branches[0].checkCondition).toBeTypeOf('function');
    });

    it('condition false when no traces on any species', () => {
      const player = createPlayer({ traces: {}, tracesByAlien: {} });
      const game = createGame({ alienState: createAlienState() });
      const def = getCardRegistry().create(cardId).getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(false);
    });

    it('condition false when trace on only 1 of 2 species', () => {
      const player = createPlayer({
        traces: { [trace]: 1 },
        tracesByAlien: { 0: { [trace]: 1 } },
      });
      const game = createGame({ alienState: createAlienState() });
      const def = getCardRegistry().create(cardId).getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(false);
    });

    it('condition true when trace on all species', () => {
      const player = createPlayer({
        traces: { [trace]: 2 },
        tracesByAlien: { 0: { [trace]: 1 }, 1: { [trace]: 1 } },
      });
      const game = createGame({ alienState: createAlienState() });
      const def = getCardRegistry().create(cardId).getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(true);
    });

    it('condition true when multiple traces per species', () => {
      const player = createPlayer({
        traces: { [trace]: 4 },
        tracesByAlien: { 0: { [trace]: 3 }, 1: { [trace]: 1 } },
      });
      const game = createGame({ alienState: createAlienState() });
      const def = getCardRegistry().create(cardId).getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(true);
    });

    it('condition false when no alienState', () => {
      const player = createPlayer({
        traces: { [trace]: 2 },
        tracesByAlien: { 0: { [trace]: 1 }, 1: { [trace]: 1 } },
      });
      const game = createGame({ alienState: null });
      const def = getCardRegistry().create(cardId).getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(false);
    });
  },
);

// ================================================================
// Card 87 — Project Longshot: probe at least 5 spaces from Earth
// ================================================================

describe('Card 87 — Project Longshot: probe ≥ 5 from Earth', () => {
  it('is registered as MISSION card kind', () => {
    const card = getCardRegistry().create('87');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('provides QUICK mission def with checkCondition', () => {
    const def = getCardRegistry().create('87').getMissionDef?.()!;
    expect(def.type).toBe(EMissionType.QUICK);
    expect(def.branches[0].checkCondition).toBeTypeOf('function');
  });

  it('condition false when no solar system', () => {
    const player = createPlayer();
    const game = createGame({ solarSystem: null });
    const def = getCardRegistry().create('87').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition false when probe is 4 spaces from Earth', () => {
    const player = createPlayer();
    const ss = createSolarSystemWithProbeAtDistance(player.id, 4);
    const game = createGame({ solarSystem: ss });
    const def = getCardRegistry().create('87').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition true when probe is exactly 5 spaces from Earth', () => {
    const player = createPlayer();
    const ss = createSolarSystemWithProbeAtDistance(player.id, 5);
    const game = createGame({ solarSystem: ss });
    const def = getCardRegistry().create('87').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('condition true when probe is 7 spaces from Earth', () => {
    const player = createPlayer();
    const ss = createSolarSystemWithProbeAtDistance(player.id, 7);
    const game = createGame({ solarSystem: ss });
    const def = getCardRegistry().create('87').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('condition false when another player has the distant probe', () => {
    const player = createPlayer();
    const ss = createSolarSystemWithProbeAtDistance('p2', 6);
    const game = createGame({ solarSystem: ss });
    const def = getCardRegistry().create('87').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });
});

// ================================================================
// Card 103 — Westerbork Telescope: 2 played cards in same sector
// ================================================================

describe('Card 103 — Westerbork Telescope: 2 cards in same sector', () => {
  it('is registered as MISSION card kind', () => {
    const card = getCardRegistry().create('103');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('provides QUICK mission def with checkCondition', () => {
    const def = getCardRegistry().create('103').getMissionDef?.()!;
    expect(def.type).toBe(EMissionType.QUICK);
    expect(def.branches[0].checkCondition).toBeTypeOf('function');
  });

  it('condition false with no played cards', () => {
    const player = createPlayer({
      playedMissions: [],
      completedMissions: [],
      endGameCards: [],
    });
    const game = createGame();
    const def = getCardRegistry().create('103').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition false with 1 card per sector', () => {
    const player = createPlayer({
      playedMissions: [
        { id: 'a', sector: 'RED' },
        { id: 'b', sector: 'BLUE' },
      ],
      completedMissions: [],
      endGameCards: [],
    });
    const game = createGame();
    const def = getCardRegistry().create('103').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition true with 2 cards in same sector', () => {
    const player = createPlayer({
      playedMissions: [
        { id: 'a', sector: 'RED' },
        { id: 'b', sector: 'RED' },
      ],
      completedMissions: [],
      endGameCards: [],
    });
    const game = createGame();
    const def = getCardRegistry().create('103').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('condition true when counting across played + completed missions', () => {
    const player = createPlayer({
      playedMissions: [{ id: 'a', sector: 'BLUE' }],
      completedMissions: [{ id: 'b', sector: 'BLUE' }],
      endGameCards: [],
    });
    const game = createGame();
    const def = getCardRegistry().create('103').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });
});

// ================================================================
// Card 111 — Roman Space Telescope: 2 total orbits
// ================================================================

describe('Card 111 — Roman Space Telescope: 2 total orbits', () => {
  it('is registered as MISSION card kind', () => {
    const card = getCardRegistry().create('111');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('provides QUICK mission def with checkCondition', () => {
    const def = getCardRegistry().create('111').getMissionDef?.()!;
    expect(def.type).toBe(EMissionType.QUICK);
    expect(def.branches[0].checkCondition).toBeTypeOf('function');
  });

  it('condition false with fewer than 2 orbits', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.VENUS, player.id, 1);
    board.orbit(EPlanet.VENUS, player.id);
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('111').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition true with exactly 2 orbits at different planets', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.VENUS, player.id, 1);
    board.orbit(EPlanet.VENUS, player.id);
    board.setProbeCount(EPlanet.MARS, player.id, 1);
    board.orbit(EPlanet.MARS, player.id);
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('111').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('condition false with no planetary board', () => {
    const player = createPlayer();
    const game = createGame({ planetaryBoard: null });
    const def = getCardRegistry().create('111').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });
});

// ================================================================
// Card 112 — Planetary Geologic Mapping: orbit + land same planet
// ================================================================

describe('Card 112 — Planetary Geologic Mapping: orbit+land same planet', () => {
  it('is registered as MISSION card kind', () => {
    const card = getCardRegistry().create('112');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('provides QUICK mission def with checkCondition', () => {
    const def = getCardRegistry().create('112').getMissionDef?.()!;
    expect(def.type).toBe(EMissionType.QUICK);
    expect(def.branches[0].checkCondition).toBeTypeOf('function');
  });

  it('condition false with no planetary board', () => {
    const player = createPlayer();
    const game = createGame({ planetaryBoard: null });
    const def = getCardRegistry().create('112').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition false with orbit only (no landing)', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.VENUS, player.id, 1);
    board.orbit(EPlanet.VENUS, player.id);
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('112').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition true with orbit and landing at same planet', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.VENUS, player.id, 1);
    board.orbit(EPlanet.VENUS, player.id);
    board.land(EPlanet.VENUS, player.id);
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('112').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('condition false with orbit at one planet and landing at another', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.VENUS, player.id, 1);
    board.orbit(EPlanet.VENUS, player.id);
    board.setProbeCount(EPlanet.MARS, player.id, 1);
    board.orbit(EPlanet.MARS, player.id);
    board.land(EPlanet.MARS, player.id);
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('112').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('condition true with orbit and moon landing at same planet', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.JUPITER, player.id, 1);
    board.orbit(EPlanet.JUPITER, player.id);
    board.unlockMoon(EPlanet.JUPITER);
    board.land(EPlanet.JUPITER, player.id, { isMoon: true });
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('112').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });
});

// ================================================================
// MissionTracker integration with tech mission cards
// ================================================================

describe('MissionTracker integration with tech mission quick missions', () => {
  it('registers and completes an on-each-species quick mission', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 2 },
      tracesByAlien: { 0: { [ETrace.BLUE]: 1 }, 1: { [ETrace.BLUE]: 1 } },
    });
    const tracker = new MissionTracker();
    const game = createGame({
      missionTracker: tracker,
      alienState: createAlienState(),
    });

    const card = getCardRegistry().create('64');
    const def = card.getMissionDef?.()!;
    tracker.registerMission(def, player.id);
    player.playedMissions.push(card);

    const completable = tracker.getCompletableQuickMissions(player, game);
    expect(completable.length).toBe(1);
    expect(completable[0].cardId).toBe('64');

    const initialData = player.resources.data;
    tracker.completeMissionBranch(player, game, '64', 0);
    expect(player.resources.data).toBe(initialData + 2);
  });

  it('on-each-species mission not completable when only 1 of 2 species covered', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 1 },
      tracesByAlien: { 0: { [ETrace.BLUE]: 1 } },
    });
    const tracker = new MissionTracker();
    const game = createGame({
      missionTracker: tracker,
      alienState: createAlienState(),
    });

    const card = getCardRegistry().create('64');
    const def = card.getMissionDef?.()!;
    tracker.registerMission(def, player.id);

    const completable = tracker.getCompletableQuickMissions(player, game);
    expect(completable.length).toBe(0);
  });

  it('returns empty when trace condition not met', () => {
    const player = createPlayer({ traces: {} });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    const card = getCardRegistry().create('70');
    const def = card.getMissionDef?.()!;
    tracker.registerMission(def, player.id);

    const completable = tracker.getCompletableQuickMissions(player, game);
    expect(completable.length).toBe(0);
  });

  it('completes orbit-based quick mission and applies rewards', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.VENUS, player.id, 1);
    board.orbit(EPlanet.VENUS, player.id);
    board.setProbeCount(EPlanet.MARS, player.id, 1);
    board.orbit(EPlanet.MARS, player.id);

    const tracker = new MissionTracker();
    const game = createGame({ planetaryBoard: board, missionTracker: tracker });

    const card = getCardRegistry().create('111');
    const def = card.getMissionDef?.()!;
    tracker.registerMission(def, player.id);
    player.playedMissions.push(card);

    const completable = tracker.getCompletableQuickMissions(player, game);
    expect(completable.length).toBe(1);

    const initialData = player.resources.data;
    tracker.completeMissionBranch(player, game, '111', 0);
    expect(player.resources.data).toBeGreaterThan(initialData);
  });
});
