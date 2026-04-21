import { EResource } from '@seti/common/types/element';
import {
  EFreeAction,
  EMainAction,
  EPhase,
} from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { Game } from '@/engine/Game.js';
import type { IGamePlayerIdentity } from '@/engine/IGame.js';
import { EComputerRow } from '@/engine/player/Computer.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { Player } from '@/engine/player/Player.js';

const TWO_P: readonly IGamePlayerIdentity[] = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createGame2p(seed: string): Game {
  return Game.create(TWO_P, { playerCount: 2 }, seed, `income-sys-${seed}`);
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

describe('IncomeSystem (Phase 10.4)', () => {
  it('10.4.1 [集成] round 1 end pays base income only (setup tuck not recurring yet)', () => {
    const game = createGame2p('10-4-1-base-only');
    const p1 = getPlayer(game, 'p1');

    expect(p1.tuckedIncomeCards.length).toBeGreaterThanOrEqual(1);
    const baseCredit = p1.income.baseIncome[EResource.CREDIT];
    const before = p1.resources.credits;
    passUntilRoundAdvances(game, 1);
    expect(p1.resources.credits - before).toBe(baseCredit);
  });

  it('10.4.2 [集成] round 2 end pays base + tucked stacked', () => {
    const game = createGame2p('10-4-2-stack');
    const p1 = getPlayer(game, 'p1');

    const full = p1.income.computeRoundPayout();
    passUntilRoundAdvances(game, 1);
    const mid = p1.resources.credits;
    passUntilRoundAdvances(game, 2);
    expect(p1.resources.credits - mid).toBe(full[EResource.CREDIT]);
  });

  it('10.4.3 [集成] tucked credit card adds +1 credit per round (from round 2)', () => {
    const game = createGame2p('10-4-3-credit-tuck');
    const p1 = getPlayer(game, 'p1');
    const tuckedBefore = p1.income.tuckedCardIncome[EResource.CREDIT];
    p1.income.addTuckedIncome(EResource.CREDIT);
    expect(p1.income.tuckedCardIncome[EResource.CREDIT]).toBe(tuckedBefore + 1);

    const base = p1.income.baseIncome[EResource.CREDIT];
    const full = p1.income.computeRoundPayout()[EResource.CREDIT];

    const c0 = p1.resources.credits;
    passUntilRoundAdvances(game, 1);
    expect(p1.resources.credits - c0).toBe(base);

    const c1 = p1.resources.credits;
    passUntilRoundAdvances(game, 2);
    expect(p1.resources.credits - c1).toBe(full);
  });

  it('10.4.4 [集成] tucked energy card adds +1 energy per round (from round 2)', () => {
    const game = createGame2p('10-4-4-energy-tuck');
    const p1 = getPlayer(game, 'p1');
    const tuckedEBefore = p1.income.tuckedCardIncome[EResource.ENERGY];
    p1.income.addTuckedIncome(EResource.ENERGY);
    expect(p1.income.tuckedCardIncome[EResource.ENERGY]).toBe(
      tuckedEBefore + 1,
    );

    const baseE = p1.income.baseIncome[EResource.ENERGY];
    const fullE = p1.income.computeRoundPayout()[EResource.ENERGY];

    const e0 = p1.resources.energy;
    passUntilRoundAdvances(game, 1);
    expect(p1.resources.energy - e0).toBe(baseE);

    const e1 = p1.resources.energy;
    passUntilRoundAdvances(game, 2);
    expect(p1.resources.energy - e1).toBe(fullE);
  });

  it('10.4.5 [集成] tucked draw-card income adds +1 card draw per round (from round 2)', () => {
    const game = createGame2p('10-4-5-card-tuck');
    const p1 = getPlayer(game, 'p1') as Player;
    p1.income.addTuckedIncome(EResource.CARD);

    passUntilRoundAdvances(game, 1);
    expect(p1.getPendingCardDrawCount()).toBe(
      p1.income.baseIncome[EResource.CARD],
    );

    const beforePending = p1.getPendingCardDrawCount();
    passUntilRoundAdvances(game, 2);
    expect(p1.getPendingCardDrawCount() - beforePending).toBe(
      p1.income.computeRoundPayout()[EResource.CARD],
    );
    expect(p1.income.computeRoundPayout()[EResource.CARD]).toBe(
      p1.income.baseIncome[EResource.CARD] + 1,
    );
  });

  it('10.4.6 [集成] tucked income from PlaceData tuckIncome reward accumulates for later round-end payout', () => {
    const game = createGame2p('10-4-6-place-data-tuck');
    const p1 = getPlayer(game, 'p1');

    p1.computer.placeTech(0, {
      techId: ETechId.COMPUTER_VP_CREDIT,
      bottomReward: { tuckIncome: 1 },
    });
    for (let i = 0; i < 6; i += 1) {
      p1.computer.placeData({ row: EComputerRow.TOP, index: i });
    }
    p1.dataPool.add(1);

    game.processFreeAction(p1.id, {
      type: EFreeAction.PLACE_DATA,
      slotIndex: 0,
    });
    expect(p1.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);
    game.processInput(p1.id, {
      type: EPlayerInputType.CARD,
      cardIds: [p1.getCardIdAt(0)],
    });
    resolveAllInputs(game, p1);

    const payoutAfterTuck = p1.income.computeRoundPayout()[EResource.CREDIT];
    expect(payoutAfterTuck).toBeGreaterThan(
      p1.income.baseIncome[EResource.CREDIT],
    );

    const baseCredit = p1.income.baseIncome[EResource.CREDIT];
    const c0 = p1.resources.credits;
    passUntilRoundAdvances(game, 1);
    expect(p1.resources.credits - c0).toBe(baseCredit);

    const c1 = p1.resources.credits;
    passUntilRoundAdvances(game, 2);
    expect(p1.resources.credits - c1).toBe(payoutAfterTuck);
  });

  it('10.4.7 [集成] multiple tucked income sources stack on round-end payout', () => {
    const game = createGame2p('10-4-7-multi-tuck');
    const p1 = getPlayer(game, 'p1');
    p1.income.addTuckedIncome(EResource.CREDIT);
    p1.income.addTuckedIncome(EResource.CREDIT);

    const extra = 2;
    expect(p1.income.computeRoundPayout()[EResource.CREDIT]).toBe(
      p1.income.baseIncome[EResource.CREDIT] + extra,
    );

    passUntilRoundAdvances(game, 1);
    const mid = p1.resources.credits;
    passUntilRoundAdvances(game, 2);
    expect(p1.resources.credits - mid).toBe(
      p1.income.baseIncome[EResource.CREDIT] + extra,
    );
  });

  it('10.4.8 implementation caps credits at 999 (rule-simple: no stated credit max; test locks engine behavior)', () => {
    const game = createGame2p('10-4-8-cap');
    const p1 = getPlayer(game, 'p1');
    p1.resources.gain({ credits: 993 });
    expect(p1.resources.credits).toBe(997);

    passUntilRoundAdvances(game, 1);
    expect(p1.resources.credits).toBe(999);
  });
});
