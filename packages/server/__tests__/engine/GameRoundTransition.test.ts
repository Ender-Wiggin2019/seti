import { EResource } from '@seti/common/types/element';
import { EMainAction, EPhase } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { Game } from '@/engine/Game.js';
import type { IGamePlayerIdentity } from '@/engine/IGame.js';
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
  const game = Game.create(TWO_P, { playerCount: 2 }, seed, `round-tr-${seed}`);
  resolveSetupTucks(game);
  return game;
}

function createGame3p(seed: string): Game {
  const game = Game.create(
    THREE_P,
    { playerCount: 3 },
    seed,
    `round-tr-3-${seed}`,
  );
  resolveSetupTucks(game);
  return game;
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

function passUntilRoundAdvances(game: Game, fromRound: number): void {
  while (game.round === fromRound) {
    if (game.phase === EPhase.GAME_OVER) {
      throw new Error('game ended before round advanced');
    }
    passPlayer(game, game.activePlayer.id);
  }
}

describe('GameRoundTransition (Phase 10.1)', () => {
  it('10.1.1 [集成] end of round: round 1 pays base only; round 2+ matches computeRoundPayout', () => {
    const game = createGame2p('10-1-1-income');
    const p1 = getPlayer(game, 'p1');
    const p2 = getPlayer(game, 'p2');

    p1.income.addTuckedIncome(EResource.CREDIT);

    const before1 = { c: p1.resources.credits, e: p1.resources.energy };
    const before2 = { c: p2.resources.credits, e: p2.resources.energy };
    const base1 = p1.income.baseIncome[EResource.CREDIT];
    const base2 = p2.income.baseIncome[EResource.CREDIT];
    const baseE1 = p1.income.baseIncome[EResource.ENERGY];
    const baseE2 = p2.income.baseIncome[EResource.ENERGY];

    passUntilRoundAdvances(game, 1);

    expect(p1.resources.credits - before1.c).toBe(base1);
    expect(p1.resources.energy - before1.e).toBe(baseE1);
    expect(p2.resources.credits - before2.c).toBe(base2);
    expect(p2.resources.energy - before2.e).toBe(baseE2);

    const mid1 = { c: p1.resources.credits, e: p1.resources.energy };
    const mid2 = { c: p2.resources.credits, e: p2.resources.energy };
    const round2p1 = p1.income.computeRoundPayout();
    const round2p2 = p2.income.computeRoundPayout();

    passUntilRoundAdvances(game, 2);

    expect(p1.resources.credits - mid1.c).toBe(round2p1[EResource.CREDIT]);
    expect(p1.resources.energy - mid1.e).toBe(round2p1[EResource.ENERGY]);
    expect(p2.resources.credits - mid2.c).toBe(round2p2[EResource.CREDIT]);
    expect(p2.resources.energy - mid2.e).toBe(round2p2[EResource.ENERGY]);
  });

  it('10.1.2 [集成] start-player marker passes to the player on the left (next in seat order)', () => {
    const game = createGame3p('10-1-2-start-player');
    const firstStart = game.startPlayer.id;
    expect(firstStart).toBe('p1');

    passUntilRoundAdvances(game, 1);

    expect(game.startPlayer.id).toBe('p2');
    expect(game.activePlayer.id).toBe('p2');
  });

  it('10.1.3 [集成] rotation reminder advances to the next end-of-round stack', () => {
    const game = createGame2p('10-1-3-rotation-reminder');
    expect(game.roundRotationReminderIndex).toBe(0);

    passUntilRoundAdvances(game, 1);

    expect(game.roundRotationReminderIndex).toBe(1);
    expect(game.round).toBe(2);
  });

  it('10.1.4 [集成] pass flags clear and the next round begins clean', () => {
    const game = createGame2p('10-1-4-pass-clear');
    expect(game.round).toBe(1);

    passPlayer(game, 'p1');
    expect(getPlayer(game, 'p1').passed).toBe(true);
    expect(getPlayer(game, 'p2').passed).toBe(false);

    passPlayer(game, 'p2');

    expect(getPlayer(game, 'p1').passed).toBe(false);
    expect(getPlayer(game, 'p2').passed).toBe(false);
    expect(game.round).toBe(2);
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });
});
