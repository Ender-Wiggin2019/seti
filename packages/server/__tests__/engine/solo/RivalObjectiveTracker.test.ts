import {
  EPlanet,
  EResource,
  ESector,
  ETech,
  ETrace,
} from '@seti/common/types/element';
import { EMainAction, EPhase } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import type { TRivalObjectiveId } from '@seti/common/types/protocol/solo';
import { Game } from '@/engine/Game.js';
import {
  EMissionEventType,
  type IMissionEvent,
} from '@/engine/missions/IMission.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

function createSoloGame(): Game {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      {
        id: 'rival:solo-objective',
        name: 'Rival Institution',
        color: 'blue',
        seatIndex: 1,
      },
    ],
    {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty: 2,
    } as Parameters<typeof Game.create>[1],
    'solo-objective-seed',
    'solo-objective',
  );
  resolveSetupTucks(game);
  game.activePlayer = game.players[0];
  game.phase = EPhase.AWAIT_END_TURN;
  return game;
}

function endHumanTurn(game: Game): void {
  game.processEndTurn('p1');
}

const triggerCases = [
  {
    name: 'probe tech',
    objectiveId: 'SOLO.5' as const,
    event: {
      type: EMissionEventType.TECH_RESEARCHED,
      techCategory: ETech.PROBE,
    },
    markers: [0],
    completed: [],
  },
  {
    name: 'computer tech',
    objectiveId: 'SOLO.6' as const,
    event: {
      type: EMissionEventType.TECH_RESEARCHED,
      techCategory: ETech.COMPUTER,
    },
    markers: [0],
    completed: [],
  },
  {
    name: 'blue life trace',
    objectiveId: 'SOLO.6' as const,
    event: {
      type: EMissionEventType.TRACE_MARKED,
      traceColor: ETrace.BLUE,
    },
    markers: [1],
    completed: [],
  },
  {
    name: 'asteroid visit',
    objectiveId: 'SOLO.7' as const,
    event: { type: EMissionEventType.PROBE_VISITED_ASTEROIDS },
    markers: [0],
    completed: [],
  },
  {
    name: 'venus mission',
    objectiveId: 'SOLO.11' as const,
    event: {
      type: EMissionEventType.PROBE_ORBITED,
      planet: EPlanet.VENUS,
    },
    markers: undefined,
    completed: ['SOLO.11'],
  },
  {
    name: 'rover mission',
    objectiveId: 'SOLO.18' as const,
    event: {
      type: EMissionEventType.PROBE_LANDED,
      planet: EPlanet.MARS,
      isMoon: false,
    },
    markers: [1],
    completed: [],
  },
  {
    name: 'satellite mission',
    objectiveId: 'SOLO.20' as const,
    event: {
      type: EMissionEventType.PROBE_ORBITED,
      planet: EPlanet.JUPITER,
    },
    markers: undefined,
    completed: ['SOLO.20'],
  },
  {
    name: '3-credit card',
    objectiveId: 'SOLO.15' as const,
    event: {
      type: EMissionEventType.CARD_PLAYED,
      cost: 3,
      costType: EResource.CREDIT,
    },
    markers: [1],
    completed: [],
  },
  {
    name: 'comet visit',
    objectiveId: 'SOLO.15' as const,
    event: { type: EMissionEventType.PROBE_VISITED_COMET },
    markers: [0],
    completed: [],
  },
  {
    name: 'completed mission',
    objectiveId: 'SOLO.5' as const,
    event: {
      type: EMissionEventType.MISSION_COMPLETED,
      cardId: '1',
      branchIndex: 0,
    },
    markers: [1],
    completed: [],
  },
  {
    name: 'yellow sector dominance',
    objectiveId: 'SOLO.8' as const,
    event: {
      type: EMissionEventType.SECTOR_COMPLETED,
      sectorId: 'sector-yellow',
      color: ESector.YELLOW,
      winnerPlayerId: 'p1',
    },
    markers: undefined,
    completed: ['SOLO.8'],
  },
] satisfies ReadonlyArray<{
  name: string;
  objectiveId: TRivalObjectiveId;
  event: IMissionEvent;
  markers: readonly number[] | undefined;
  completed: readonly TRivalObjectiveId[];
}>;

describe('RivalObjectiveTracker', () => {
  it('completes and refills a revealed objective when the human has 16 VP', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.revealedObjectiveIds = ['SOLO.1', 'SOLO.2', 'SOLO.3'];
    rivalState.objectiveDrawPile = ['SOLO.4'];
    rivalState.completedObjectiveIds = [];
    game.players[0].score = 16;

    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual(['SOLO.1']);
    expect(rivalState.revealedObjectiveIds).toEqual([
      'SOLO.2',
      'SOLO.3',
      'SOLO.4',
    ]);
    expect(rivalState.objectiveDrawPile).toEqual([]);
  });

  it('completes a revealed objective when the human has 5 data in the pool', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.revealedObjectiveIds = ['SOLO.3'];
    rivalState.objectiveDrawPile = [];
    rivalState.completedObjectiveIds = [];
    game.players[0].dataPool.add(5);

    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual(['SOLO.3']);
    expect(rivalState.revealedObjectiveIds).toEqual([]);
  });

  it('marks the publicity task without completing a multi-task objective', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.revealedObjectiveIds = ['SOLO.16'];
    rivalState.objectiveDrawPile = [];
    rivalState.completedObjectiveIds = [];
    game.players[0].publicity = 9;

    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual([]);
    expect(rivalState.revealedObjectiveIds).toEqual(['SOLO.16']);
    expect(rivalState.objectiveTaskMarkers['SOLO.16']).toEqual([1]);
  });

  it('requires 9 publicity to complete SOLO.4', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.revealedObjectiveIds = ['SOLO.4'];
    rivalState.objectiveDrawPile = [];
    rivalState.completedObjectiveIds = [];
    game.players[0].publicity = 8;

    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual([]);
    expect(rivalState.revealedObjectiveIds).toEqual(['SOLO.4']);

    game.activePlayer = game.players[0];
    game.phase = EPhase.AWAIT_END_TURN;
    game.players[0].publicity = 9;

    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual(['SOLO.4']);
    expect(rivalState.revealedObjectiveIds).toEqual([]);
  });

  it('completes a multi-task objective after launch and publicity are both marked', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.revealedObjectiveIds = ['SOLO.16'];
    rivalState.objectiveDrawPile = [];
    rivalState.completedObjectiveIds = [];
    game.players[0].publicity = 9;
    game.phase = EPhase.AWAIT_MAIN_ACTION;

    game.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });
    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual(['SOLO.16']);
    expect(rivalState.revealedObjectiveIds).toEqual([]);
    expect(rivalState.objectiveTaskMarkers['SOLO.16']).toBeUndefined();
  });

  it('marks only one matching task from a single trigger event', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.revealedObjectiveIds = ['SOLO.23'];
    rivalState.objectiveDrawPile = [];
    rivalState.completedObjectiveIds = [];
    game.missionTracker.recordEvent({ type: EMissionEventType.SCAN_PERFORMED });

    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual([]);
    expect(rivalState.objectiveTaskMarkers['SOLO.23']).toEqual([0]);
  });

  it('marks only the first matching revealed objective from a single trigger event', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.revealedObjectiveIds = ['SOLO.16', 'SOLO.22'];
    rivalState.objectiveDrawPile = [];
    rivalState.completedObjectiveIds = [];
    game.missionTracker.recordEvent({ type: EMissionEventType.PROBE_LAUNCHED });

    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual([]);
    expect(rivalState.objectiveTaskMarkers['SOLO.16']).toEqual([0]);
    expect(rivalState.objectiveTaskMarkers['SOLO.22']).toBeUndefined();
  });

  it('allows one tech event to claim a triggerable mission and mark a solo objective', () => {
    const game = createSoloGame();
    const player = game.players[0];
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.revealedObjectiveIds = ['SOLO.14'];
    rivalState.objectiveDrawPile = [];
    rivalState.completedObjectiveIds = [];
    player.playedMissions.push('76');
    game.missionTracker.registerMissionFromCard('76', player.id);
    game.missionTracker.recordEvent({
      type: EMissionEventType.TECH_RESEARCHED,
      techCategory: ETech.SCAN,
    });

    const missionPrompt = game.missionTracker.checkAndPromptTriggers(
      player,
      game,
    );
    const promptModel = missionPrompt?.toModel() as
      | ISelectOptionInputModel
      | undefined;
    expect(promptModel?.type).toBe(EPlayerInputType.OPTION);
    expect(promptModel?.options.map((option) => option.id)).toContain(
      'complete-76-1',
    );
    missionPrompt?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'complete-76-1',
    });

    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual(['SOLO.14']);
    expect(rivalState.objectiveTaskMarkers['SOLO.14']).toBeUndefined();
  });

  it('immediately marks static tasks on objectives revealed by the same refresh', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.revealedObjectiveIds = ['SOLO.2'];
    rivalState.objectiveDrawPile = ['SOLO.1', 'SOLO.3'];
    rivalState.completedObjectiveIds = [];
    game.players[0].score = 16;
    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_LANDED,
      planet: EPlanet.MARS,
      isMoon: false,
    });

    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual(['SOLO.2', 'SOLO.1']);
    expect(rivalState.revealedObjectiveIds).toEqual(['SOLO.3']);
    expect(rivalState.objectiveDrawPile).toEqual([]);
  });

  it.each(triggerCases)('maps $name objective trigger events', (testCase) => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.revealedObjectiveIds = [testCase.objectiveId];
    rivalState.objectiveDrawPile = [];
    rivalState.completedObjectiveIds = [];
    game.missionTracker.recordEvent(testCase.event);

    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual(testCase.completed);
    expect(rivalState.objectiveTaskMarkers[testCase.objectiveId]).toEqual(
      testCase.markers,
    );
  });

  it('does not mark a dominance objective when another player wins the sector', () => {
    const game = createSoloGame();
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');
    rivalState.revealedObjectiveIds = ['SOLO.8'];
    rivalState.objectiveDrawPile = [];
    rivalState.completedObjectiveIds = [];
    game.missionTracker.recordEvent({
      type: EMissionEventType.SECTOR_COMPLETED,
      sectorId: 'sector-yellow',
      color: ESector.YELLOW,
      winnerPlayerId: 'rival:solo-objective',
    });

    endHumanTurn(game);

    expect(rivalState.completedObjectiveIds).toEqual([]);
    expect(rivalState.objectiveTaskMarkers['SOLO.8']).toBeUndefined();
  });
});
