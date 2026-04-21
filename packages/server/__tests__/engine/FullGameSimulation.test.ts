import { EResource } from '@seti/common/types/element';
import {
  EAlienType,
  EMainAction,
  EPhase,
  ETrace,
} from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
  type ISelectGoldTileInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { DummyAlienPlugin } from '@/engine/alien/plugins/DummyAlienPlugin.js';
import { Game } from '@/engine/Game.js';
import type { IGamePlayerIdentity } from '@/engine/IGame.js';
import type { TIncomeBundle } from '@/engine/player/Income.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

const BASE_PLAYERS: readonly IGamePlayerIdentity[] = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
  { id: 'p3', name: 'Cathy', color: 'green', seatIndex: 2 },
  { id: 'p4', name: 'Dylan', color: 'yellow', seatIndex: 3 },
] as const;

/** Resolves chained inputs for one player (mirrors GameIntegration + TRACE for alien flows). */
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
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: (doneOpt ?? optModel.options[0]).id,
      });
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
    } else if (model.type === EPlayerInputType.TRACE) {
      game.processInput(player.id, {
        type: EPlayerInputType.TRACE,
        trace: model.options[0],
      });
    } else {
      break;
    }
  }
}

function getPlayer(game: Game, id: string): IPlayer {
  const p = game.players.find((x) => x.id === id);
  if (!p) {
    throw new Error(`missing player ${id}`);
  }
  return p;
}

function passPlayer(game: Game, playerId: string): void {
  game.processMainAction(playerId, { type: EMainAction.PASS });
  resolveAllInputs(game, getPlayer(game, playerId));
  drainAnyWaitingInputs(game);
}

/** Milestone / discovery may queue input on another seat order than active player. */
function drainAnyWaitingInputs(game: Game): void {
  for (let i = 0; i < 500; i += 1) {
    const pending = game.players.find((p) => p.waitingFor);
    if (!pending) {
      return;
    }
    resolveAllInputs(game, pending);
  }
  throw new Error('input resolution did not settle');
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
  for (let i = 0; i < rounds; i += 1) {
    passOneRound(game);
    if (game.phase === EPhase.GAME_OVER) {
      break;
    }
  }
}

function attachPhaseSpy(game: Game): EPhase[] {
  const seen: EPhase[] = [];
  const original = game.transitionTo.bind(game);
  game.transitionTo = (next: EPhase): void => {
    seen.push(next);
    original(next);
  };
  return seen;
}

/** Matches `Player.applyEndOfRoundIncome(round)` payout shape (round 1 = base only). */
function expectedEndOfRoundIncomeBundle(
  player: IPlayer,
  round: number,
): TIncomeBundle {
  return round === 1
    ? { ...player.income.baseIncome }
    : player.income.computeRoundPayout();
}

describe('FullGameSimulation (Phase 10.3)', () => {
  describe('10.3.1 [集成] 2 人 5 轮 — 固定 seed + 全 PASS 仿真', () => {
    it('reproducible final scores and game over after 5 rounds', () => {
      const seed = 'phase-10-3-1-two-player-five-rounds';
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        seed,
        seed,
      );

      expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
      expect(game.round).toBe(1);

      advanceRounds(game, 5);

      expect(game.phase).toBe(EPhase.GAME_OVER);
      expect(game.finalScoringResult).toBeDefined();

      const scores = game.finalScoringResult!.scores;
      expect(scores.p1).toBe(1);
      expect(scores.p2).toBe(2);
    });
  });

  describe('10.3.2 [集成] 3 人 — 中立里程碑补满发现位 → ResolveDiscovery', () => {
    beforeEach(() => {
      AlienRegistry.clear();
      AlienRegistry.register(new DummyAlienPlugin());
    });

    afterEach(() => {
      AlienRegistry.clear();
    });

    it('neutral milestone at 20 VP completes third discovery slot and logs discovery', () => {
      const seed = 'phase-10-3-2-neutral-to-discovery';
      const game = Game.create(
        BASE_PLAYERS.slice(0, 3),
        { playerCount: 3 },
        seed,
        seed,
      );

      expect(game.neutralMilestones).toEqual([20, 30]);

      const p1 = game.players[0];
      const board = game.alienState.boards[0];
      Object.assign(board, { alienType: EAlienType.DUMMY });

      game.alienState.applyTrace(p1, game, ETrace.RED, 0, false);
      game.alienState.applyTrace(p1, game, ETrace.YELLOW, 0, false);
      p1.score = 22;

      passPlayer(game, game.activePlayer.id);

      const discovered = game.eventLog
        .toArray()
        .filter((e) => e.type === 'ACTION' && e.action === 'ALIEN_DISCOVERED');
      expect(discovered.length).toBeGreaterThanOrEqual(1);

      const neutral = game.eventLog
        .toArray()
        .filter(
          (e) =>
            e.type === 'ACTION' && e.action === 'MILESTONE_NEUTRAL_RESOLVED',
        );
      expect(neutral.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('10.3.3 [集成] 4 人 — 无中立里程碑', () => {
    it('setup has no neutral milestone markers', () => {
      const game = Game.create(
        BASE_PLAYERS,
        { playerCount: 4 },
        'phase-10-3-3-four-player-no-neutral',
      );
      expect(game.neutralMilestones).toEqual([]);
    });

    it('5-round all-PASS simulation reaches GAME_OVER', () => {
      const seed = 'phase-10-3-3-four-player-sim';
      const game = Game.create(BASE_PLAYERS, { playerCount: 4 }, seed, seed);
      advanceRounds(game, 5);
      expect(game.phase).toBe(EPhase.GAME_OVER);
      expect(game.finalScoringResult?.scores).toBeDefined();
    });
  });

  describe('10.3.4 [集成] phase 链 — AWAIT_MAIN_ACTION 循环与终局', () => {
    it('records END_OF_ROUND ×5 then FINAL_SCORING then GAME_OVER (PLAY = AWAIT_MAIN_ACTION)', () => {
      const seed = 'phase-10-3-4-phase-chain';
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        seed,
        seed,
      );

      const transitions = attachPhaseSpy(game);
      advanceRounds(game, 5);

      expect(transitions.filter((p) => p === EPhase.END_OF_ROUND).length).toBe(
        5,
      );
      expect(transitions).toContain(EPhase.FINAL_SCORING);
      expect(transitions.at(-1)).toBe(EPhase.GAME_OVER);
    });
  });

  describe('10.3.5 [集成] 每回合收入累积与 Income.computeRoundPayout 一致', () => {
    it('each end-of-round grants credits/energy equal to computeRoundPayout (no spending)', () => {
      const seed = 'phase-10-3-5-income-accumulation';
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        seed,
        seed,
      );

      const perRoundCredits: number[] = [];

      for (let r = 1; r <= 5; r += 1) {
        const eorRound = game.round;
        const payouts = game.players.map((p) =>
          expectedEndOfRoundIncomeBundle(p, eorRound),
        );
        const before = game.players.map((p) => ({
          credits: p.resources.credits,
          energy: p.resources.energy,
        }));

        passOneRound(game);

        for (let i = 0; i < game.players.length; i += 1) {
          expect(game.players[i].resources.credits - before[i].credits).toBe(
            payouts[i][EResource.CREDIT],
          );
          expect(game.players[i].resources.energy - before[i].energy).toBe(
            payouts[i][EResource.ENERGY],
          );
        }

        perRoundCredits.push(payouts[0][EResource.CREDIT]);

        if (game.phase === EPhase.GAME_OVER) {
          expect(r).toBe(5);
          break;
        }
      }

      expect(game.phase).toBe(EPhase.GAME_OVER);
      expect(perRoundCredits).toHaveLength(5);
    });
  });
});
