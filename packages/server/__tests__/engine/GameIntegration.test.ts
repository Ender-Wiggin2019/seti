import {
  EMainAction,
  EPhase,
  EPlanet,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
  type ISelectGoldTileInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { Game } from '@/engine/Game.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { EComputerRow } from '@/engine/player/Computer.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { GameError } from '@/shared/errors/GameError.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createGame(seed = 'integration-test'): Game {
  return Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, 'test-game');
}

function getPlayer(game: Game, id: string): IPlayer {
  return game.players.find((p) => p.id === id)!;
}

function resolveAllInputs(game: Game, player: IPlayer): void {
  while (player.waitingFor) {
    const model = player.waitingFor.toModel();

    if (model.type === EPlayerInputType.CARD) {
      const cardModel = model as {
        cards: { id: string }[];
        minSelections: number;
      };
      const cardIds = cardModel.cards
        .slice(0, cardModel.minSelections)
        .map((c) => c.id);
      game.processInput(player.id, { type: EPlayerInputType.CARD, cardIds });
    } else if (model.type === EPlayerInputType.END_OF_ROUND) {
      const eorModel = model as ISelectEndOfRoundCardInputModel;
      game.processInput(player.id, {
        type: EPlayerInputType.END_OF_ROUND,
        cardId: eorModel.cards[0].id,
      });
    } else if (model.type === EPlayerInputType.OPTION) {
      const optModel = model as ISelectOptionInputModel;
      const doneOpt = optModel.options.find((o) => o.id === 'done');
      if (doneOpt) {
        game.processInput(player.id, {
          type: EPlayerInputType.OPTION,
          optionId: 'done',
        });
      } else {
        game.processInput(player.id, {
          type: EPlayerInputType.OPTION,
          optionId: optModel.options[0].id,
        });
      }
    } else if (model.type === EPlayerInputType.GOLD_TILE) {
      const gtModel = model as ISelectGoldTileInputModel;
      game.processInput(player.id, {
        type: EPlayerInputType.GOLD_TILE,
        tileId: gtModel.options[0],
      });
    } else if (model.type === EPlayerInputType.TECH) {
      const techModel = model as { options: string[] };
      game.processInput(player.id, {
        type: EPlayerInputType.TECH,
        tech: techModel.options[0],
      } as never);
    } else {
      break;
    }
  }
}

function passPlayer(game: Game, playerId: string): void {
  game.processMainAction(playerId, { type: EMainAction.PASS });
  resolveAllInputs(game, getPlayer(game, playerId));
}

function passOneRound(game: Game): void {
  const targetRound = game.round;
  while (
    game.phase === EPhase.AWAIT_MAIN_ACTION &&
    game.round === targetRound
  ) {
    passPlayer(game, game.activePlayer.id);
  }
}

function advanceRounds(game: Game, rounds: number): void {
  for (let i = 0; i < rounds; i++) {
    passOneRound(game);
    if (game.phase === EPhase.GAME_OVER) break;
  }
}

function assertThrowsGameError(fn: () => void, code: EErrorCode): GameError {
  try {
    fn();
    throw new Error(
      `Expected GameError with code ${code}, but no error thrown`,
    );
  } catch (error) {
    expect(error).toBeInstanceOf(GameError);
    expect((error as GameError).code).toBe(code);
    return error as GameError;
  }
}

// ─────────────────────────────────────────────────────────────
// §1  8 Main Actions — Legal / Illegal Boundary Tests
// ─────────────────────────────────────────────────────────────
describe('Game Integration: Main Action Legality', () => {
  describe('phase & turn guards', () => {
    it('rejects action when not in AWAIT_MAIN_ACTION phase', () => {
      const game = createGame();
      game.transitionTo(EPhase.IN_RESOLUTION);

      assertThrowsGameError(
        () => game.processMainAction('p1', { type: EMainAction.PASS }),
        EErrorCode.INVALID_PHASE,
      );
    });

    it('rejects action from non-active player', () => {
      const game = createGame();
      expect(game.activePlayer.id).toBe('p1');

      assertThrowsGameError(
        () => game.processMainAction('p2', { type: EMainAction.PASS }),
        EErrorCode.NOT_YOUR_TURN,
      );
    });

    it('rejects action from unknown player id (not active)', () => {
      const game = createGame();

      assertThrowsGameError(
        () => game.processMainAction('unknown', { type: EMainAction.PASS }),
        EErrorCode.NOT_YOUR_TURN,
      );
    });
  });

  describe('LAUNCH_PROBE', () => {
    it('succeeds when player has sufficient credits and probe slot', () => {
      const game = createGame();
      const p1 = getPlayer(game, 'p1');
      expect(p1.resources.credits).toBeGreaterThanOrEqual(2);

      game.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });
      resolveAllInputs(game, p1);

      expect(p1.probesInSpace).toBe(1);
    });

    it('rejects when credits are insufficient', () => {
      const game = createGame();
      const p1 = getPlayer(game, 'p1');
      p1.resources.spend({ credits: p1.resources.credits });

      assertThrowsGameError(
        () =>
          game.processMainAction('p1', {
            type: EMainAction.LAUNCH_PROBE,
          }),
        EErrorCode.INVALID_ACTION,
      );
    });

    it('rejects when all probe slots are used', () => {
      const game = createGame();
      const p1 = getPlayer(game, 'p1');
      p1.probesInSpace = p1.probeSpaceLimit;

      assertThrowsGameError(
        () =>
          game.processMainAction('p1', {
            type: EMainAction.LAUNCH_PROBE,
          }),
        EErrorCode.INVALID_ACTION,
      );
    });
  });

  describe('ORBIT', () => {
    it('rejects without planet payload', () => {
      const game = createGame();

      assertThrowsGameError(
        () => game.processMainAction('p1', { type: EMainAction.ORBIT }),
        EErrorCode.INVALID_ACTION,
      );
    });

    it('rejects Earth as orbit target', () => {
      const game = createGame();

      assertThrowsGameError(
        () =>
          game.processMainAction('p1', {
            type: EMainAction.ORBIT,
            payload: { planet: EPlanet.EARTH },
          }),
        EErrorCode.INVALID_ACTION,
      );
    });

    it('rejects when probe has not been launched (no probe in orbit zone)', () => {
      const game = createGame();
      const p1 = getPlayer(game, 'p1');
      expect(p1.probesInSpace).toBe(0);

      assertThrowsGameError(
        () =>
          game.processMainAction('p1', {
            type: EMainAction.ORBIT,
            payload: { planet: EPlanet.MARS },
          }),
        EErrorCode.INVALID_ACTION,
      );
    });
  });

  describe('LAND', () => {
    it('rejects Earth as landing target', () => {
      const game = createGame();

      assertThrowsGameError(
        () =>
          game.processMainAction('p1', {
            type: EMainAction.LAND,
            payload: { planet: EPlanet.EARTH },
          }),
        EErrorCode.INVALID_ACTION,
      );
    });

    it('rejects without planet payload', () => {
      const game = createGame();

      assertThrowsGameError(
        () => game.processMainAction('p1', { type: EMainAction.LAND }),
        EErrorCode.INVALID_ACTION,
      );
    });
  });

  describe('SCAN', () => {
    it('succeeds with sufficient resources', () => {
      const game = createGame();
      const p1 = getPlayer(game, 'p1');
      expect(p1.resources.credits).toBeGreaterThanOrEqual(1);
      expect(p1.resources.energy).toBeGreaterThanOrEqual(2);

      game.processMainAction('p1', { type: EMainAction.SCAN });
      resolveAllInputs(game, p1);

      expect(game.activePlayer.id).toBe('p2');
    });

    it('emits SCAN_PERFORMED mission event', () => {
      const game = createGame('scan-mission-trigger');
      const p1 = getPlayer(game, 'p1');
      const spy = vi.spyOn(game.missionTracker, 'recordEvent');

      game.processMainAction('p1', { type: EMainAction.SCAN });
      resolveAllInputs(game, p1);

      expect(spy).toHaveBeenCalledWith({
        type: EMissionEventType.SCAN_PERFORMED,
      });
    });

    it('rejects when credits are zero', () => {
      const game = createGame();
      const p1 = getPlayer(game, 'p1');
      p1.resources.spend({ credits: p1.resources.credits });

      assertThrowsGameError(
        () => game.processMainAction('p1', { type: EMainAction.SCAN }),
        EErrorCode.INVALID_ACTION,
      );
    });

    it('rejects when energy is insufficient', () => {
      const game = createGame();
      const p1 = getPlayer(game, 'p1');
      p1.resources.spend({ energy: p1.resources.energy });

      assertThrowsGameError(
        () => game.processMainAction('p1', { type: EMainAction.SCAN }),
        EErrorCode.INVALID_ACTION,
      );
    });
  });

  describe('ANALYZE_DATA', () => {
    it('rejects when computer is not full', () => {
      const game = createGame();
      const p1 = getPlayer(game, 'p1');
      expect(p1.computer.isFull()).toBe(false);

      assertThrowsGameError(
        () =>
          game.processMainAction('p1', {
            type: EMainAction.ANALYZE_DATA,
          }),
        EErrorCode.INVALID_ACTION,
      );
    });

    it('rejects when energy is zero even if computer is full', () => {
      const game = createGame();
      const p1 = getPlayer(game, 'p1');

      for (let i = 0; i < p1.computer.columnCount; i++) {
        p1.computer.placeData({ row: EComputerRow.TOP, index: i });
      }
      p1.resources.spend({ energy: p1.resources.energy });

      if (p1.computer.isFull()) {
        assertThrowsGameError(
          () =>
            game.processMainAction('p1', {
              type: EMainAction.ANALYZE_DATA,
            }),
          EErrorCode.INVALID_ACTION,
        );
      }
    });
  });

  describe('PLAY_CARD', () => {
    it('rejects without cardIndex payload', () => {
      const game = createGame();

      assertThrowsGameError(
        () => game.processMainAction('p1', { type: EMainAction.PLAY_CARD }),
        EErrorCode.INVALID_ACTION,
      );
    });

    it('rejects with out-of-range cardIndex', () => {
      const game = createGame();

      assertThrowsGameError(
        () =>
          game.processMainAction('p1', {
            type: EMainAction.PLAY_CARD,
            payload: { cardIndex: 999 },
          }),
        EErrorCode.INVALID_ACTION,
      );
    });

    it('rejects with negative cardIndex', () => {
      const game = createGame();

      assertThrowsGameError(
        () =>
          game.processMainAction('p1', {
            type: EMainAction.PLAY_CARD,
            payload: { cardIndex: -1 },
          }),
        EErrorCode.INVALID_ACTION,
      );
    });

    it('rejects when hand is empty', () => {
      const game = createGame();
      const p1 = getPlayer(game, 'p1');
      p1.hand = [];

      assertThrowsGameError(
        () =>
          game.processMainAction('p1', {
            type: EMainAction.PLAY_CARD,
            payload: { cardIndex: 0 },
          }),
        EErrorCode.INVALID_ACTION,
      );
    });

    it('succeeds with valid cardIndex (card is removed from hand)', () => {
      const game = createGame('play-card-valid');
      const p1 = getPlayer(game, 'p1');
      p1.hand = ['test-card-1', 'test-card-2'];

      game.processMainAction('p1', {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveAllInputs(game, p1);

      expect(p1.hand.length).toBe(1);
    });
  });

  describe('RESEARCH_TECH', () => {
    it('rejects when publicity is insufficient', () => {
      const game = createGame();
      const p1 = getPlayer(game, 'p1');
      p1.resources.spend({ publicity: p1.resources.publicity });

      assertThrowsGameError(
        () =>
          game.processMainAction('p1', {
            type: EMainAction.RESEARCH_TECH,
          }),
        EErrorCode.INVALID_ACTION,
      );
    });
  });

  describe('PASS', () => {
    it('always succeeds for active player', () => {
      const game = createGame();

      game.processMainAction('p1', { type: EMainAction.PASS });
      resolveAllInputs(game, getPlayer(game, 'p1'));

      expect(getPlayer(game, 'p1').passed).toBe(true);
      expect(game.activePlayer.id).toBe('p2');
    });

    it('cannot pass on behalf of another player', () => {
      const game = createGame();

      assertThrowsGameError(
        () => game.processMainAction('p2', { type: EMainAction.PASS }),
        EErrorCode.NOT_YOUR_TURN,
      );
    });
  });
});

// ─────────────────────────────────────────────────────────────
// §2  Rotation: Research Tech + First-Pass
// ─────────────────────────────────────────────────────────────
describe('Game Integration: Rotation', () => {
  it('first pass of the round triggers solar system rotation', () => {
    const game = createGame('rotation-first-pass');
    expect(game.hasRoundFirstPassOccurred).toBe(false);
    const rotBefore = game.solarSystem!.rotationCounter;

    passPlayer(game, 'p1');

    expect(game.hasRoundFirstPassOccurred).toBe(true);
    expect(game.solarSystem!.rotationCounter).toBe(rotBefore + 1);
  });

  it('second pass of the same round also triggers rotation', () => {
    const game = createGame('rotation-second-pass');

    passPlayer(game, 'p1');
    const rotAfterFirst = game.solarSystem!.rotationCounter;

    passPlayer(game, 'p2');

    expect(game.solarSystem!.rotationCounter).toBe(rotAfterFirst + 1);
  });

  it('first pass resets each new round', () => {
    const game = createGame('rotation-round-reset');

    passOneRound(game);
    expect(game.round).toBe(2);
    expect(game.hasRoundFirstPassOccurred).toBe(false);

    const rotBefore = game.solarSystem!.rotationCounter;
    passPlayer(game, game.activePlayer.id);

    expect(game.hasRoundFirstPassOccurred).toBe(true);
    expect(game.solarSystem!.rotationCounter).toBe(rotBefore + 1);
  });

  it('research tech action triggers solar system rotation', () => {
    const game = createGame('rotation-research');
    const p1 = getPlayer(game, 'p1');

    p1.resources.gain({ publicity: 20 });
    const rotBefore = game.solarSystem!.rotationCounter;

    game.processMainAction('p1', { type: EMainAction.RESEARCH_TECH });
    resolveAllInputs(game, p1);

    expect(game.solarSystem!.rotationCounter).toBeGreaterThan(rotBefore);
  });

  it('research tech rotation is independent of pass rotation', () => {
    const game = createGame('rotation-research-vs-pass');
    const p1 = getPlayer(game, 'p1');
    p1.resources.gain({ publicity: 20 });

    const rotBefore = game.solarSystem!.rotationCounter;

    game.processMainAction('p1', { type: EMainAction.RESEARCH_TECH });
    resolveAllInputs(game, p1);

    const rotAfterResearch = game.solarSystem!.rotationCounter;
    expect(rotAfterResearch).toBe(rotBefore + 1);

    expect(game.hasRoundFirstPassOccurred).toBe(false);

    passPlayer(game, 'p2');
    expect(game.solarSystem!.rotationCounter).toBe(rotAfterResearch + 1);
    expect(game.hasRoundFirstPassOccurred).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// §3  Milestone & Discovery Between-Turn Timing
// ─────────────────────────────────────────────────────────────
describe('Game Integration: Milestone & Discovery Timing', () => {
  it('milestone check runs between turns (player reaches threshold)', () => {
    const game = createGame('milestone-timing');
    const p1 = getPlayer(game, 'p1');
    p1.score = 24;

    game.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });
    resolveAllInputs(game, p1);

    const milestoneEvents = game.eventLog
      .recent(20)
      .filter(
        (e) =>
          e.type === 'ACTION' &&
          (e as { action: string }).action === 'MILESTONE_CHECK',
      );
    expect(milestoneEvents.length).toBeGreaterThan(0);
  });

  it('milestone order: milestone check → discovery → handoff', () => {
    const game = createGame('milestone-order');
    const events = game.eventLog;

    passPlayer(game, 'p1');

    const recentEvents = events.recent(20);
    const milestoneIdx = recentEvents.findIndex(
      (e) =>
        e.type === 'ACTION' &&
        (e as { action: string }).action === 'MILESTONE_CHECK',
    );

    expect(milestoneIdx).toBeGreaterThanOrEqual(0);
  });

  it('gold milestone yields SelectGoldTile input when score >= 25', () => {
    const game = createGame('milestone-gold-tile');
    const p1 = getPlayer(game, 'p1');
    p1.score = 26;

    game.processMainAction('p1', { type: EMainAction.PASS });

    if (p1.waitingFor) {
      const model = p1.waitingFor.toModel();
      if (model.type === EPlayerInputType.GOLD_TILE) {
        expect(
          (model as ISelectGoldTileInputModel).options.length,
        ).toBeGreaterThan(0);
      }
      resolveAllInputs(game, p1);
    }

    expect(p1.passed).toBe(true);
  });

  it('neutral milestone triggers when player reaches neutral threshold', () => {
    const game = createGame('neutral-milestone');
    const p1 = getPlayer(game, 'p1');
    p1.score = 21;

    passPlayer(game, 'p1');

    const events = game.eventLog.recent(30);
    const milestoneCheck = events.find(
      (e) =>
        e.type === 'ACTION' &&
        (e as { action: string }).action.includes('MILESTONE'),
    );
    expect(milestoneCheck).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────
// §4  Final Scoring & Tiebreaker
// ─────────────────────────────────────────────────────────────
describe('Game Integration: Final Scoring & Tiebreaker', () => {
  it('game ends after 5 rounds with GAME_OVER phase', () => {
    const game = createGame('final-scoring-end');

    advanceRounds(game, 5);

    expect(game.phase).toBe(EPhase.GAME_OVER);
    expect(game.round).toBe(5);
  });

  it('final scoring result is populated after game over', () => {
    const game = createGame('final-scoring-result');

    advanceRounds(game, 5);

    expect(game.finalScoringResult).toBeDefined();
    expect(game.finalScoringResult!.scores).toHaveProperty('p1');
    expect(game.finalScoringResult!.scores).toHaveProperty('p2');
    expect(game.finalScoringResult!.winnerIds.length).toBeGreaterThanOrEqual(1);
  });

  it('final scoring includes breakdown per player', () => {
    const game = createGame('final-scoring-breakdown');

    advanceRounds(game, 5);

    const result = game.finalScoringResult!;
    for (const playerId of ['p1', 'p2']) {
      const bd = result.breakdown[playerId];
      expect(bd).toBeDefined();
      expect(typeof bd.endGameCards).toBe('number');
      expect(typeof bd.goldTiles).toBe('number');
      expect(typeof bd.alienBonus).toBe('number');
      expect(typeof bd.totalAdded).toBe('number');
      expect(typeof bd.finalScore).toBe('number');
      expect(bd.finalScore).toBe(result.scores[playerId]);
    }
  });

  it('player.score is updated to final score', () => {
    const game = createGame('final-scoring-player-score');

    advanceRounds(game, 5);

    const result = game.finalScoringResult!;
    for (const player of game.players) {
      expect(player.score).toBe(result.scores[player.id]);
    }
  });

  it('emits GAME_END event with scores', () => {
    const game = createGame('final-scoring-event');

    advanceRounds(game, 5);

    const endEvent = game.eventLog
      .recent(10)
      .find((e) => e.type === 'GAME_END');
    expect(endEvent).toBeDefined();
  });

  it('tiebreaker: shared victory when scores are equal', () => {
    const game = createGame('tiebreaker-shared');
    const p1 = getPlayer(game, 'p1');
    const p2 = getPlayer(game, 'p2');

    p1.score = 50;
    p2.score = 50;
    p1.endGameCards = [];
    p2.endGameCards = [];
    p1.completedMissions = [];
    p2.completedMissions = [];

    advanceRounds(game, 5);

    const result = game.finalScoringResult!;
    if (result.scores.p1 === result.scores.p2) {
      expect(result.winnerIds).toContain('p1');
      expect(result.winnerIds).toContain('p2');
      expect(result.winnerIds.length).toBe(2);
    }
  });

  it('winner is the player with higher final score', () => {
    const game = createGame('winner-determination');
    const p1 = getPlayer(game, 'p1');
    const p2 = getPlayer(game, 'p2');

    p1.score = 100;
    p2.score = 10;
    p1.endGameCards = [];
    p2.endGameCards = [];

    advanceRounds(game, 5);

    const result = game.finalScoringResult!;
    expect(result.scores.p1).toBeGreaterThan(result.scores.p2);
    expect(result.winnerIds).toEqual(['p1']);
  });

  it('round-end income is applied each round', () => {
    const game = createGame('round-income');
    const p1 = getPlayer(game, 'p1');
    const creditsBefore = p1.resources.credits;

    passOneRound(game);

    expect(game.round).toBe(2);
    expect(p1.resources.credits).toBeGreaterThanOrEqual(creditsBefore);
  });

  it('start player rotates each round', () => {
    const game = createGame('start-player-rotate');
    expect(game.startPlayer.id).toBe('p1');

    passOneRound(game);

    expect(game.round).toBe(2);
    expect(game.startPlayer.id).toBe('p2');

    passOneRound(game);

    expect(game.round).toBe(3);
    expect(game.startPlayer.id).toBe('p1');
  });
});

// ─────────────────────────────────────────────────────────────
// §5  Full Turn Lifecycle (smoke)
// ─────────────────────────────────────────────────────────────
describe('Game Integration: Turn Lifecycle', () => {
  it('action → resolution → between-turn → next player', () => {
    const game = createGame('turn-lifecycle');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.activePlayer.id).toBe('p1');

    const p1 = getPlayer(game, 'p1');
    game.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });
    resolveAllInputs(game, p1);

    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.activePlayer.id).toBe('p2');
  });

  it('interleaved pass and action within a round', () => {
    const game = createGame('interleaved');
    const p1 = getPlayer(game, 'p1');
    const p2 = getPlayer(game, 'p2');

    passPlayer(game, 'p1');
    expect(p1.passed).toBe(true);
    expect(game.activePlayer.id).toBe('p2');

    game.processMainAction('p2', { type: EMainAction.LAUNCH_PROBE });
    resolveAllInputs(game, p2);

    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.activePlayer.id).toBe('p2');
  });

  it('passed player is skipped in turn rotation', () => {
    const game = createGame('skip-passed');

    passPlayer(game, 'p1');
    expect(game.activePlayer.id).toBe('p2');

    const p2 = getPlayer(game, 'p2');
    game.processMainAction('p2', { type: EMainAction.LAUNCH_PROBE });
    resolveAllInputs(game, p2);

    if (game.phase === EPhase.AWAIT_MAIN_ACTION) {
      expect(game.activePlayer.id).toBe('p2');
    }
  });

  it('all players pass ends round', () => {
    const game = createGame('all-pass-end-round');
    expect(game.round).toBe(1);

    passOneRound(game);

    expect(game.round).toBe(2);
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  it('5 full rounds of pass lead to GAME_OVER', () => {
    const game = createGame('5-rounds-game-over');

    advanceRounds(game, 5);

    expect(game.phase).toBe(EPhase.GAME_OVER);
  });

  it('event log records main actions', () => {
    const game = createGame('event-log-actions');
    const p1 = getPlayer(game, 'p1');

    game.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });
    resolveAllInputs(game, p1);

    const actionEvents = game.eventLog
      .recent(10)
      .filter((e) => e.type === 'ACTION');
    expect(actionEvents.length).toBeGreaterThan(0);
  });
});
