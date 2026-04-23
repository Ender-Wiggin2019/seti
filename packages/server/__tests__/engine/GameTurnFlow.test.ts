import { EResource } from '@seti/common/types/element';
import {
  EFreeAction,
  EMainAction,
  EPhase,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { DummyAlienPlugin } from '@/engine/alien/plugins/DummyAlienPlugin.js';
import { EScanSubAction } from '@/engine/effects/scan/ScanActionPool.js';
import type { TGameEvent } from '@/engine/event/GameEvent.js';
import { Game } from '@/engine/Game.js';
import type { IGamePlayerIdentity } from '@/engine/IGame.js';
import { EComputerRow } from '@/engine/player/Computer.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { resolveSetupTucks } from '../helpers/TestGameBuilder.js';

const TWO_P: readonly IGamePlayerIdentity[] = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

const THREE_P: readonly IGamePlayerIdentity[] = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
  { id: 'p3', name: 'Cathy', color: 'green', seatIndex: 2 },
] as const;

function createGame2p(seed: string): Game {
  const game = Game.create(
    TWO_P,
    { playerCount: 2 },
    seed,
    `turn-flow-${seed}`,
  );
  resolveSetupTucks(game);
  return game;
}

function createGame3p(seed: string): Game {
  const game = Game.create(
    THREE_P,
    { playerCount: 3 },
    seed,
    `turn-flow-3-${seed}`,
  );
  resolveSetupTucks(game);
  return game;
}

function getPlayer(game: Game, id: string): IPlayer {
  return game.players.find((p) => p.id === id)!;
}

function actionEvents(game: Game): Extract<TGameEvent, { type: 'ACTION' }>[] {
  return game.eventLog
    .toArray()
    .filter(
      (e): e is Extract<TGameEvent, { type: 'ACTION' }> => e.type === 'ACTION',
    );
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
      const optModel = model as { options: { id: string }[] };
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
      const gtModel = model as { options: string[] };
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

describe('GameTurnFlow (Phase 10.2)', () => {
  it('10.2.1 [集成] start player takes the first turn, then clockwise seat order', () => {
    const game = createGame2p('10-2-1-clockwise');
    expect(game.startPlayer.id).toBe('p1');
    expect(game.activePlayer.id).toBe('p1');

    passPlayer(game, 'p1');
    expect(game.activePlayer.id).toBe('p2');

    passPlayer(game, 'p2');
    expect(game.round).toBe(2);
    expect(game.startPlayer.id).toBe('p2');
    expect(game.activePlayer.id).toBe('p2');
  });

  it('10.2.2 [集成] hands off to the next player who has not passed this round', () => {
    const game = createGame3p('10-2-2-skip-passed');
    passPlayer(game, 'p1');
    expect(game.activePlayer.id).toBe('p2');

    game.processMainAction('p2', { type: EMainAction.LAUNCH_PROBE });
    resolveAllInputs(game, getPlayer(game, 'p2'));
    game.processEndTurn('p2');

    passPlayer(game, 'p3');

    expect(game.activePlayer.id).toBe('p2');
  });

  it('10.2.3 [集成] one main action and a free action fit in the same turn before END_TURN', () => {
    const game = createGame2p('10-2-3-main-plus-free');
    const p1 = getPlayer(game, 'p1');

    game.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });
    resolveAllInputs(game, p1);
    expect(game.phase).toBe(EPhase.AWAIT_END_TURN);

    const creditsBefore = p1.resources.credits;
    game.processFreeAction('p1', {
      type: EFreeAction.EXCHANGE_RESOURCES,
      from: EResource.CREDIT,
      to: EResource.ENERGY,
    });
    expect(p1.resources.credits).toBe(creditsBefore - 2);

    game.processEndTurn('p1');
    expect(game.activePlayer.id).toBe('p2');
  });

  it('10.2.4 [集成] Scan 结算后（AWAIT_END_TURN）可执行 PLACE_DATA 再 END_TURN', () => {
    const game = createGame2p('10-2-4-scan-place-data');
    const p1 = getPlayer(game, 'p1');

    game.processMainAction('p1', { type: EMainAction.SCAN });
    resolveAllInputs(game, p1);

    expect(game.phase).toBe(EPhase.AWAIT_END_TURN);
    expect(p1.dataPool.count).toBeGreaterThan(0);

    game.processFreeAction('p1', {
      type: EFreeAction.PLACE_DATA,
      slotIndex: 0,
    });
    expect(p1.dataPool.count).toBe(0);

    game.processEndTurn('p1');
    expect(game.activePlayer.id).toBe('p2');
  });

  it('10.2.4b [集成] Scan 进行中可插入 PLACE_DATA，然后继续 done 完成主行动', () => {
    const game = createGame2p('10-2-4b-scan-interrupt');
    const p1 = getPlayer(game, 'p1');

    game.processMainAction('p1', { type: EMainAction.SCAN });

    game.processInput('p1', {
      type: EPlayerInputType.OPTION,
      optionId: EScanSubAction.MARK_EARTH,
    });

    // MARK_EARTH gives 1 data; spend it during the still-running SCAN.
    expect(p1.dataPool.count).toBe(1);
    game.processFreeAction('p1', {
      type: EFreeAction.PLACE_DATA,
      slotIndex: 0,
    });
    expect(p1.dataPool.count).toBe(0);
    expect(p1.computer.getTopSlots()[0]).toBe(true);

    // SCAN should remain resumable after the interrupting free action.
    expect(p1.waitingFor?.toModel().type).toBe(EPlayerInputType.OPTION);
    game.processInput('p1', {
      type: EPlayerInputType.OPTION,
      optionId: EScanSubAction.DONE,
    });

    expect(game.phase).toBe(EPhase.AWAIT_END_TURN);
    game.processEndTurn('p1');
    expect(game.activePlayer.id).toBe('p2');
  });

  describe('10.2.5 / free-action nesting', () => {
    it('10.2.5 [集成] rejects a second free action while place-data still needs input', () => {
      const game = createGame2p('10-2-5-free-lock');
      const p1 = getPlayer(game, 'p1');

      p1.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { tuckIncome: 1 },
      });
      for (let index = 0; index < p1.computer.columnCount; index += 1) {
        p1.computer.placeData({ row: EComputerRow.TOP, index });
      }
      p1.dataPool.add(1);

      game.processFreeAction(p1.id, {
        type: EFreeAction.PLACE_DATA,
        slotIndex: 0,
      });

      expect(p1.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);

      expect(() =>
        game.processFreeAction(p1.id, {
          type: EFreeAction.BUY_CARD,
          fromDeck: true,
        }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_INPUT_RESPONSE }),
      );
    });
  });

  describe('10.2.6 / between-turn pipeline', () => {
    beforeEach(() => {
      AlienRegistry.clear();
      AlienRegistry.register(new DummyAlienPlugin());
    });

    afterEach(() => {
      AlienRegistry.clear();
    });

    it('10.2.6 [集成] after END_TURN: milestone check runs before handing off (and discovery after milestone)', () => {
      const game = createGame2p('10-2-6-milestone-order');
      const p1 = getPlayer(game, 'p1');

      p1.score = 25;

      game.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });
      resolveAllInputs(game, p1);
      game.processEndTurn('p1');

      resolveAllInputs(game, p1);

      const actions = actionEvents(game).map((e) => e.action);
      const endIdx = actions.indexOf('END_TURN');
      const checkIdx = actions.indexOf('MILESTONE_CHECK');
      expect(endIdx).toBeGreaterThanOrEqual(0);
      expect(checkIdx).toBeGreaterThan(endIdx);

      const goldIdx = actions.indexOf('MILESTONE_GOLD_RESOLVED');
      expect(goldIdx).toBeGreaterThan(checkIdx);

      expect(game.activePlayer.id).toBe('p2');
    });
  });

  it('10.2.7 [集成] when everyone has passed, the round ends and income is applied', () => {
    const game = createGame2p('10-2-7-round-end');
    const p1 = getPlayer(game, 'p1');
    const p2 = getPlayer(game, 'p2');

    const baseP1 = p1.income.baseIncome[EResource.CREDIT];
    const baseP2 = p2.income.baseIncome[EResource.CREDIT];
    const before1 = p1.resources.credits;
    const before2 = p2.resources.credits;

    passPlayer(game, 'p1');
    passPlayer(game, 'p2');

    expect(game.round).toBe(2);
    expect(p1.resources.credits - before1).toBe(baseP1);
    expect(p2.resources.credits - before2).toBe(baseP2);
  });
});
