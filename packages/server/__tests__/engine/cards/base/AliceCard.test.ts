import { ETrace } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import { AlienState } from '@/engine/alien/AlienState.js';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import { CompleteMissionFreeAction } from '@/engine/freeActions/CompleteMission.js';
import type { IGame } from '@/engine/IGame.js';
import { EMissionType } from '@/engine/missions/IMission.js';
import { MissionTracker } from '@/engine/missions/MissionTracker.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Player 1',
    color: 'blue',
    seatIndex: 0,
    resources: { credits: 10, energy: 5, publicity: 5, data: 0 },
    hand: [],
    ...overrides,
  });
}

function createAlienState(
  types: EAlienType[] = [EAlienType.CENTAURIANS, EAlienType.EXERTIANS],
): AlienState {
  return AlienState.createFromHiddenAliens(types);
}

function createGame(overrides: Record<string, unknown> = {}): IGame {
  return {
    sectors: [],
    mainDeck: new Deck<string>(['d1', 'd2', 'd3', 'd4', 'd5']),
    cardRow: [],
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('alice-card-test'),
    missionTracker: new MissionTracker(),
    solarSystem: null,
    techBoard: null,
    planetaryBoard: null,
    alienState: createAlienState(),
    round: 1,
    ...overrides,
  } as unknown as IGame;
}

// ================================================================
// Card 64 — ALICE: card metadata & mission definition
// ================================================================

describe('Card 64 — ALICE: card metadata', () => {
  it('is registered as MISSION card kind', () => {
    const card = getCardRegistry().create('64');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('has the correct card id and name', () => {
    const card = getCardRegistry().create('64');
    expect(card.id).toBe('64');
    expect(card.name).toBe('ALICE');
  });

  it('provides QUICK mission def', () => {
    const def = getCardRegistry().create('64').getMissionDef?.()!;
    expect(def).toBeDefined();
    expect(def.type).toBe(EMissionType.QUICK);
    expect(def.cardId).toBe('64');
  });

  it('mission def has a single branch with checkCondition', () => {
    const def = getCardRegistry().create('64').getMissionDef?.()!;
    expect(def.branches).toHaveLength(1);
    expect(def.branches[0].checkCondition).toBeTypeOf('function');
  });
});

// ================================================================
// Card 64 — ALICE: checkCondition (blue trace on ALL species)
// ================================================================

describe('Card 64 — ALICE: checkCondition requires blue trace on all species', () => {
  const getDef = () => getCardRegistry().create('64').getMissionDef?.()!;

  it('false when player has no traces at all', () => {
    const player = createPlayer({ traces: {}, tracesByAlien: {} });
    const game = createGame();
    expect(getDef().branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('false when player has traces of other colors but no blue', () => {
    const player = createPlayer({
      traces: { [ETrace.RED]: 2, [ETrace.YELLOW]: 1 },
      tracesByAlien: {
        0: { [ETrace.RED]: 2 },
        1: { [ETrace.YELLOW]: 1 },
      },
    });
    const game = createGame();
    expect(getDef().branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('false when blue trace on only 1 of 2 species', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 1 },
      tracesByAlien: { 0: { [ETrace.BLUE]: 1 } },
    });
    const game = createGame();
    expect(getDef().branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('false even with many blue traces all on 1 species', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 5 },
      tracesByAlien: { 0: { [ETrace.BLUE]: 5 } },
    });
    const game = createGame();
    expect(getDef().branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('true when blue trace on all 2 species', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 2 },
      tracesByAlien: {
        0: { [ETrace.BLUE]: 1 },
        1: { [ETrace.BLUE]: 1 },
      },
    });
    const game = createGame();
    expect(getDef().branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('true when multiple blue traces per species', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 4 },
      tracesByAlien: {
        0: { [ETrace.BLUE]: 3 },
        1: { [ETrace.BLUE]: 1 },
      },
    });
    const game = createGame();
    expect(getDef().branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('true when mixed colors but blue present on all species', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 2, [ETrace.RED]: 1 },
      tracesByAlien: {
        0: { [ETrace.BLUE]: 1, [ETrace.RED]: 1 },
        1: { [ETrace.BLUE]: 1 },
      },
    });
    const game = createGame();
    expect(getDef().branches[0].checkCondition!(player, game)).toBe(true);
  });

  it('false when alienState is null', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 2 },
      tracesByAlien: { 0: { [ETrace.BLUE]: 1 }, 1: { [ETrace.BLUE]: 1 } },
    });
    const game = createGame({ alienState: null });
    expect(getDef().branches[0].checkCondition!(player, game)).toBe(false);
  });

  it('false when alienState has empty boards', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 1 },
      tracesByAlien: { 0: { [ETrace.BLUE]: 1 } },
    });
    const game = createGame({
      alienState: new AlienState({ aliens: [] }),
    });
    expect(getDef().branches[0].checkCondition!(player, game)).toBe(false);
  });
});

// ================================================================
// Card 64 — ALICE: MissionTracker completability
// ================================================================

describe('Card 64 — ALICE: MissionTracker completability', () => {
  it('not completable when player has no blue traces', () => {
    const player = createPlayer({ traces: {}, tracesByAlien: {} });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    const def = getCardRegistry().create('64').getMissionDef?.()!;
    tracker.registerMission(def, player.id);

    expect(tracker.getCompletableQuickMissions(player, game)).toHaveLength(0);
    expect(tracker.hasCompletableQuickMissions(player, game)).toBe(false);
  });

  it('not completable when only 1 of 2 species covered', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 1 },
      tracesByAlien: { 0: { [ETrace.BLUE]: 1 } },
    });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    const def = getCardRegistry().create('64').getMissionDef?.()!;
    tracker.registerMission(def, player.id);

    expect(tracker.getCompletableQuickMissions(player, game)).toHaveLength(0);
  });

  it('completable when blue trace on all species', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 2 },
      tracesByAlien: {
        0: { [ETrace.BLUE]: 1 },
        1: { [ETrace.BLUE]: 1 },
      },
    });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    const def = getCardRegistry().create('64').getMissionDef?.()!;
    tracker.registerMission(def, player.id);

    const completable = tracker.getCompletableQuickMissions(player, game);
    expect(completable).toHaveLength(1);
    expect(completable[0].cardId).toBe('64');
    expect(completable[0].branchIndex).toBe(0);
  });
});

// ================================================================
// Card 64 — ALICE: reward on completion (flat 2 data)
// ================================================================

describe('Card 64 — ALICE: reward application', () => {
  it('gives exactly 2 data when completed', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 2 },
      tracesByAlien: {
        0: { [ETrace.BLUE]: 1 },
        1: { [ETrace.BLUE]: 1 },
      },
    });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    const card = getCardRegistry().create('64');
    const def = card.getMissionDef?.()!;
    tracker.registerMission(def, player.id);
    player.playedMissions.push(card);

    const initialData = player.resources.data;
    tracker.completeMissionBranch(player, game, '64', 0);
    expect(player.resources.data).toBe(initialData + 2);
  });

  it('mission moves to completedMissions after completion', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 2 },
      tracesByAlien: {
        0: { [ETrace.BLUE]: 1 },
        1: { [ETrace.BLUE]: 1 },
      },
    });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    const card = getCardRegistry().create('64');
    const def = card.getMissionDef?.()!;
    tracker.registerMission(def, player.id);
    player.playedMissions.push(card);

    expect(player.playedMissions).toHaveLength(1);
    expect(player.completedMissions).toHaveLength(0);

    tracker.completeMissionBranch(player, game, '64', 0);

    expect(player.playedMissions).toHaveLength(0);
    expect(player.completedMissions).toHaveLength(1);
  });

  it('cannot be completed again after full completion', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 2 },
      tracesByAlien: {
        0: { [ETrace.BLUE]: 1 },
        1: { [ETrace.BLUE]: 1 },
      },
    });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    const card = getCardRegistry().create('64');
    const def = card.getMissionDef?.()!;
    tracker.registerMission(def, player.id);
    player.playedMissions.push(card);

    tracker.completeMissionBranch(player, game, '64', 0);

    expect(tracker.getCompletableQuickMissions(player, game)).toHaveLength(0);
  });
});

// ================================================================
// Card 64 — ALICE: CompleteMissionFreeAction integration
// ================================================================

describe('Card 64 — ALICE: CompleteMissionFreeAction', () => {
  it('canExecute true when all species have blue trace', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 2 },
      tracesByAlien: {
        0: { [ETrace.BLUE]: 1 },
        1: { [ETrace.BLUE]: 1 },
      },
    });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    const card = getCardRegistry().create('64');
    tracker.registerMission(card.getMissionDef?.()!, player.id);

    expect(CompleteMissionFreeAction.canExecute(player, game)).toBe(true);
  });

  it('canExecute false when only 1 species covered', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 1 },
      tracesByAlien: { 0: { [ETrace.BLUE]: 1 } },
    });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    const card = getCardRegistry().create('64');
    tracker.registerMission(card.getMissionDef?.()!, player.id);

    expect(CompleteMissionFreeAction.canExecute(player, game)).toBe(false);
  });

  it('execute applies 2 data reward via free action', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 2 },
      tracesByAlien: {
        0: { [ETrace.BLUE]: 1 },
        1: { [ETrace.BLUE]: 1 },
      },
    });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    const card = getCardRegistry().create('64');
    tracker.registerMission(card.getMissionDef?.()!, player.id);
    player.playedMissions.push(card);

    const initialData = player.resources.data;
    CompleteMissionFreeAction.execute(player, game, '64');
    expect(player.resources.data).toBe(initialData + 2);
  });

  it('throws when not all species have blue trace', () => {
    const player = createPlayer({
      traces: { [ETrace.BLUE]: 1 },
      tracesByAlien: { 0: { [ETrace.BLUE]: 1 } },
    });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    const card = getCardRegistry().create('64');
    tracker.registerMission(card.getMissionDef?.()!, player.id);

    expect(() => CompleteMissionFreeAction.execute(player, game, '64')).toThrow(
      /not completable/,
    );
  });
});

// ================================================================
// Card 64 — ALICE: integration with AlienState trace placement
// ================================================================

describe('Card 64 — ALICE: integration with AlienState', () => {
  it('becomes completable only after traces placed on all species via AlienState', () => {
    const player = createPlayer();
    const alienState = createAlienState();
    const tracker = new MissionTracker();
    const game = createGame({
      alienState,
      missionTracker: tracker,
    });

    const card = getCardRegistry().create('64');
    const def = card.getMissionDef?.()!;
    tracker.registerMission(def, player.id);
    player.playedMissions.push(card);

    expect(tracker.hasCompletableQuickMissions(player, game)).toBe(false);

    alienState.applyTrace(player, game, ETrace.BLUE, 0, false);
    expect(tracker.hasCompletableQuickMissions(player, game)).toBe(false);

    alienState.applyTrace(player, game, ETrace.BLUE, 1, false);
    expect(tracker.hasCompletableQuickMissions(player, game)).toBe(true);

    const initialData = player.resources.data;
    tracker.completeMissionBranch(player, game, '64', 0);
    expect(player.resources.data).toBe(initialData + 2);
  });

  it('red traces on aliens do not satisfy ALICE condition', () => {
    const player = createPlayer();
    const alienState = createAlienState();
    const tracker = new MissionTracker();
    const game = createGame({
      alienState,
      missionTracker: tracker,
    });

    const def = getCardRegistry().create('64').getMissionDef?.()!;
    tracker.registerMission(def, player.id);

    alienState.applyTrace(player, game, ETrace.RED, 0, false);
    alienState.applyTrace(player, game, ETrace.RED, 1, false);

    expect(tracker.hasCompletableQuickMissions(player, game)).toBe(false);
  });

  it('mixed colors: need blue on both species, not just any color', () => {
    const player = createPlayer();
    const alienState = createAlienState();
    const tracker = new MissionTracker();
    const game = createGame({
      alienState,
      missionTracker: tracker,
    });

    const def = getCardRegistry().create('64').getMissionDef?.()!;
    tracker.registerMission(def, player.id);

    alienState.applyTrace(player, game, ETrace.BLUE, 0, false);
    alienState.applyTrace(player, game, ETrace.RED, 1, false);

    expect(tracker.hasCompletableQuickMissions(player, game)).toBe(false);

    alienState.applyTrace(player, game, ETrace.BLUE, 1, false);
    expect(tracker.hasCompletableQuickMissions(player, game)).toBe(true);
  });

  it('overflow traces still count for the species', () => {
    const player = createPlayer();
    const alienState = createAlienState();
    const tracker = new MissionTracker();
    const game = createGame({
      alienState,
      missionTracker: tracker,
    });

    const def = getCardRegistry().create('64').getMissionDef?.()!;
    tracker.registerMission(def, player.id);

    alienState.applyTrace(player, game, ETrace.BLUE, 0, true);
    alienState.applyTrace(player, game, ETrace.BLUE, 1, true);

    expect(tracker.hasCompletableQuickMissions(player, game)).toBe(true);
  });
});
