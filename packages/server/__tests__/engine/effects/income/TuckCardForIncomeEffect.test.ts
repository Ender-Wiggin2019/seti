import { EResource } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { loadCardData } from '@/engine/cards/loadCardData.js';
import { TuckCardForIncomeEffect } from '@/engine/effects/income/TuckCardForIncomeEffect.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createPlayer(hand: string[] = []): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    hand,
  });
}

function createGame(draws: string[] = []): IGame {
  return {
    mainDeck: {
      drawWithReshuffle: () => draws.shift(),
    },
    random: { next: () => 0.5 },
  } as unknown as IGame;
}

describe('TuckCardForIncomeEffect', () => {
  it('canExecute is false when hand is empty', () => {
    const player = createPlayer([]);
    expect(TuckCardForIncomeEffect.canExecute(player)).toBe(false);
  });

  it('returns SelectCard input when player has cards', () => {
    const player = createPlayer(['16']);

    const input = TuckCardForIncomeEffect.execute(player, createGame());

    expect(input).toBeDefined();
    expect(input?.toModel().type).toBe(EPlayerInputType.CARD);
  });

  it('tucks selected card and applies immediate income gain', () => {
    const cardId = '16';
    const player = createPlayer([cardId]);
    const game = createGame(['drawn-1']);

    const before = {
      credits: player.resources.credits,
      energy: player.resources.energy,
      data: player.data.poolCount,
      handSize: player.hand.length,
      tucked: player.tuckedIncomeCards.length,
    };

    const input = TuckCardForIncomeEffect.execute(player, game);
    expect(input).toBeDefined();
    input?.process({ type: EPlayerInputType.CARD, cardIds: [cardId] });

    expect(player.tuckedIncomeCards.length).toBe(before.tucked + 1);

    const incomeType = loadCardData(cardId).income;
    if (incomeType === EResource.CARD) {
      expect(player.hand.length).toBe(before.handSize);
      expect(player.hand).toContain('drawn-1');
    } else {
      expect(player.hand.length).toBe(before.handSize - 1);
      if (incomeType === EResource.CREDIT) {
        expect(player.resources.credits).toBe(before.credits + 1);
      }
      if (incomeType === EResource.ENERGY) {
        expect(player.resources.energy).toBe(before.energy + 1);
      }
      if (incomeType === EResource.DATA) {
        expect(player.data.poolCount).toBe(before.data + 1);
      }
    }
  });

  it('second tuck stacks tuckedCardIncome for future round-end payout', () => {
    const player = createPlayer(['64', '46']);
    const game = createGame([]);

    const first = TuckCardForIncomeEffect.execute(player, game);
    expect(first).toBeDefined();
    first?.process({ type: EPlayerInputType.CARD, cardIds: ['64'] });

    const second = TuckCardForIncomeEffect.execute(player, game);
    expect(second).toBeDefined();
    second?.process({ type: EPlayerInputType.CARD, cardIds: ['46'] });

    expect(player.tuckedIncomeCards.length).toBe(2);
    expect(player.income.tuckedCardIncome[EResource.CREDIT]).toBe(2);
  });

  it('clears pending setup tucks when no card can be selected', () => {
    const player = createPlayer([]);
    player.pendingSetupTucks = 1;

    const input = TuckCardForIncomeEffect.executeSetupChain(player, createGame());

    expect(input).toBeUndefined();
    expect(player.pendingSetupTucks).toBe(0);
  });
});
