import { EResource } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
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
import { activateMission } from '../../../helpers/missionTestUtils.js';

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

function createCometSpace(playerId?: string): ISolarSystemSpace {
  return {
    id: 'comet-space',
    ringIndex: 2,
    indexInRing: 5,
    discIndex: 1,
    hasPublicityIcon: false,
    elements: [{ type: ESolarSystemElementType.COMET, amount: 1 }],
    occupants: playerId ? [{ id: 'probe-1', playerId }] : [],
  };
}

function createEmptySpace(): ISolarSystemSpace {
  return {
    id: 'empty-space',
    ringIndex: 1,
    indexInRing: 0,
    discIndex: 0,
    hasPublicityIcon: false,
    elements: [{ type: ESolarSystemElementType.EMPTY, amount: 1 }],
    occupants: [],
  };
}

function createGame(overrides: Record<string, unknown> = {}): IGame {
  return {
    sectors: [],
    mainDeck: new Deck<string>(['d1', 'd2', 'd3', 'd4', 'd5']),
    cardRow: [],
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('probe-mission-test'),
    missionTracker: new MissionTracker(),
    solarSystem: null,
    techBoard: null,
    planetaryBoard: null,
    round: 1,
    ...overrides,
  } as unknown as IGame;
}

// ================================================================
// Card registration & mission def
// ================================================================

describe.each([
  { cardId: '5', name: 'Venera Probe', planet: EPlanet.VENUS },
  { cardId: '6', name: 'Juno Probe', planet: EPlanet.JUPITER },
  { cardId: '7', name: 'MESSENGER Probe', planet: EPlanet.MERCURY },
  { cardId: '8', name: 'Cassini Probe', planet: EPlanet.SATURN },
  { cardId: '58', name: 'Uranus Orbiter', planet: EPlanet.URANUS },
  { cardId: '60', name: 'Trident Probe', planet: EPlanet.NEPTUNE },
])(
  'Planet probe — Card $cardId ($name): orbit/land at $planet',
  ({ cardId, planet }) => {
    it('is registered as MISSION card kind', () => {
      const card = getCardRegistry().create(cardId);
      expect(card.kind).toBe(EServerCardKind.MISSION);
    });

    it('provides a QUICK mission def via getMissionDef()', () => {
      const card = getCardRegistry().create(cardId);
      const def = card.getMissionDef?.();
      expect(def).toBeDefined();
      expect(def!.type).toBe(EMissionType.QUICK);
      expect(def!.branches).toHaveLength(1);
      expect(def!.branches[0].checkCondition).toBeTypeOf('function');
    });

    it('condition is false when no orbit/land at target planet', () => {
      const player = createPlayer();
      const board = createPlanetaryBoard();
      const game = createGame({ planetaryBoard: board });
      const card = getCardRegistry().create(cardId);
      const def = card.getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(false);
    });

    it('condition is true when player has orbit at target planet', () => {
      const player = createPlayer();
      const board = createPlanetaryBoard();
      board.setProbeCount(planet, player.id, 1);
      board.orbit(planet, player.id);
      const game = createGame({ planetaryBoard: board });
      const card = getCardRegistry().create(cardId);
      const def = card.getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(true);
    });

    it('condition is true when player has landing at target planet', () => {
      const player = createPlayer();
      const board = createPlanetaryBoard();
      board.setProbeCount(planet, player.id, 1);
      board.orbit(planet, player.id);
      board.land(planet, player.id);
      const game = createGame({ planetaryBoard: board });
      const card = getCardRegistry().create(cardId);
      const def = card.getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(true);
    });

    it('condition is false when another player has orbit (not this player)', () => {
      const player = createPlayer();
      const board = createPlanetaryBoard();
      board.setProbeCount(planet, 'p2', 1);
      board.orbit(planet, 'p2');
      const game = createGame({ planetaryBoard: board });
      const card = getCardRegistry().create(cardId);
      const def = card.getMissionDef?.()!;

      expect(def.branches[0].checkCondition!(player, game)).toBe(false);
    });

    it('completes via CompleteMission free action when condition met', () => {
      const player = createPlayer({ playedMissions: [] });
      const board = createPlanetaryBoard();
      board.setProbeCount(planet, player.id, 1);
      board.orbit(planet, player.id);
      const tracker = new MissionTracker();
      const game = createGame({
        planetaryBoard: board,
        missionTracker: tracker,
      });

      const card = getCardRegistry().create(cardId);
      const def = card.getMissionDef?.()!;
      tracker.registerMission(def, player.id);
      player.playedMissions.push(card);

      const completable = tracker.getCompletableQuickMissions(player, game);
      expect(completable.length).toBe(1);
      expect(completable[0].cardId).toBe(cardId);

      const initialScore = player.score;
      tracker.completeMissionBranch(player, game, cardId, 0);

      expect(player.score).toBeGreaterThan(initialScore);
    });
  },
);

// ================================================================
// Card 31 — Space Launch System: 3 landings, exclude moons
// ================================================================

describe('Card 31 — Space Launch System: 3 total landings (no moons)', () => {
  it('is registered as MISSION card kind', () => {
    const card = getCardRegistry().create('31');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('provides QUICK mission def with checkCondition', () => {
    const card = getCardRegistry().create('31');
    const def = card.getMissionDef?.()!;
    expect(def.type).toBe(EMissionType.QUICK);
    expect(def.branches[0].checkCondition).toBeTypeOf('function');
  });

  it('condition false with fewer than 3 landings', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.VENUS, player.id, 1);
    board.orbit(EPlanet.VENUS, player.id);
    board.land(EPlanet.VENUS, player.id);
    board.setProbeCount(EPlanet.MARS, player.id, 1);
    board.orbit(EPlanet.MARS, player.id);
    board.land(EPlanet.MARS, player.id);
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('31').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition true with 3 landings across different planets', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    for (const planet of [EPlanet.VENUS, EPlanet.MARS, EPlanet.MERCURY]) {
      board.setProbeCount(planet, player.id, 1);
      board.orbit(planet, player.id);
      board.land(planet, player.id);
    }
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('31').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('moon landings do not count toward the 3-landing requirement', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();

    board.setProbeCount(EPlanet.VENUS, player.id, 1);
    board.orbit(EPlanet.VENUS, player.id);
    board.land(EPlanet.VENUS, player.id);

    board.setProbeCount(EPlanet.MARS, player.id, 1);
    board.orbit(EPlanet.MARS, player.id);
    board.land(EPlanet.MARS, player.id);

    board.setProbeCount(EPlanet.JUPITER, player.id, 1);
    board.orbit(EPlanet.JUPITER, player.id);
    board.unlockMoon(EPlanet.JUPITER);
    board.land(EPlanet.JUPITER, player.id, { isMoon: true });

    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('31').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });
});

// ================================================================
// Card 104 — Rosetta Probe: probe on comet
// ================================================================

describe('Card 104 — Rosetta Probe: probe on a comet', () => {
  it('is registered as MISSION card kind', () => {
    const card = getCardRegistry().create('104');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('provides QUICK mission def with checkCondition', () => {
    const card = getCardRegistry().create('104');
    const def = card.getMissionDef?.()!;
    expect(def.type).toBe(EMissionType.QUICK);
    expect(def.branches[0].checkCondition).toBeTypeOf('function');
  });

  it('condition false when no solar system', () => {
    const player = createPlayer();
    const game = createGame({ solarSystem: null });
    const def = getCardRegistry().create('104').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition false when no probe on comet', () => {
    const player = createPlayer();
    const solarSystem = {
      spaces: [createCometSpace(), createEmptySpace()],
    };
    const game = createGame({ solarSystem });
    const def = getCardRegistry().create('104').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition true when player has probe on comet space', () => {
    const player = createPlayer();
    const solarSystem = {
      spaces: [createCometSpace(player.id), createEmptySpace()],
    };
    const game = createGame({ solarSystem });
    const def = getCardRegistry().create('104').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('condition false when another player has probe on comet', () => {
    const player = createPlayer();
    const solarSystem = {
      spaces: [createCometSpace('p2'), createEmptySpace()],
    };
    const game = createGame({ solarSystem });
    const def = getCardRegistry().create('104').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });
});

// ================================================================
// Card 132 — Space Shuttle: 5 total orbit+land
// ================================================================

describe('Card 132 — Space Shuttle: 5 total orbit+land', () => {
  it('is registered as MISSION card kind', () => {
    const card = getCardRegistry().create('132');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('provides QUICK mission def with checkCondition', () => {
    const card = getCardRegistry().create('132');
    const def = card.getMissionDef?.()!;
    expect(def.type).toBe(EMissionType.QUICK);
    expect(def.branches[0].checkCondition).toBeTypeOf('function');
  });

  it('condition false with fewer than 5 total orbit+land', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    for (const planet of [EPlanet.VENUS, EPlanet.MARS]) {
      board.setProbeCount(planet, player.id, 1);
      board.orbit(planet, player.id);
      board.land(planet, player.id);
    }
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('132').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('condition true with 5 orbit+land across planets', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    for (const planet of [EPlanet.VENUS, EPlanet.MARS, EPlanet.MERCURY]) {
      board.setProbeCount(planet, player.id, 1);
      board.orbit(planet, player.id);
    }
    board.land(EPlanet.VENUS, player.id);
    board.land(EPlanet.MARS, player.id);
    const game = createGame({ planetaryBoard: board });
    const def = getCardRegistry().create('132').getMissionDef?.()!;

    expect(def.branches[0].checkCondition!(player, game)).toBe(true);
  });
});

// ================================================================
// Integration: MissionTracker with checkCondition
// ================================================================

describe('MissionTracker integration with QUICK_MISSION checkCondition', () => {
  it('getCompletableQuickMissions uses checkCondition from card def', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.VENUS, player.id, 1);
    board.orbit(EPlanet.VENUS, player.id);

    const tracker = new MissionTracker();
    const game = createGame({ planetaryBoard: board, missionTracker: tracker });

    const card = getCardRegistry().create('5');
    const def = card.getMissionDef?.()!;
    tracker.registerMission(def, player.id);
    activateMission(player, '5');

    const completable = tracker.getCompletableQuickMissions(player, game);
    expect(completable.length).toBe(1);
    expect(completable[0].cardId).toBe('5');
  });

  it('returns empty when checkCondition is not met', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();

    const tracker = new MissionTracker();
    const game = createGame({ planetaryBoard: board, missionTracker: tracker });

    const card = getCardRegistry().create('5');
    const def = card.getMissionDef?.()!;
    tracker.registerMission(def, player.id);
    activateMission(player, '5');

    const completable = tracker.getCompletableQuickMissions(player, game);
    expect(completable.length).toBe(0);
  });

  it('completing branch applies rewards correctly', () => {
    const player = createPlayer();
    const board = createPlanetaryBoard();
    board.setProbeCount(EPlanet.VENUS, player.id, 1);
    board.orbit(EPlanet.VENUS, player.id);

    const tracker = new MissionTracker();
    const game = createGame({ planetaryBoard: board, missionTracker: tracker });

    const card = getCardRegistry().create('5');
    const def = card.getMissionDef?.()!;
    tracker.registerMission(def, player.id);
    activateMission(player, '5');

    const initialScore = player.score;
    const initialPublicity = player.resources.publicity;

    tracker.completeMissionBranch(player, game, '5', 0);

    expect(player.score).toBe(initialScore + 7);
    expect(player.resources.publicity).toBe(initialPublicity + 1);
  });
});
