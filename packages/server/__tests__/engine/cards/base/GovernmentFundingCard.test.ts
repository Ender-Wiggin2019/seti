import { EResource } from '@seti/common/types/element';
import { PlayCardAction } from '@/engine/actions/PlayCard.js';
import { GovernmentFunding } from '@/engine/cards/base/GovernmentFundingCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { stubTurnLockFields } from '../../../helpers/stubTurnLock.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    score: 5,
    tuckedIncomeCards: ['108', '90'],
  });
}

function createGame(): IGame {
  return {
    ...stubTurnLockFields(),
    mainDeck: new Deck<string>([]),
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('government-funding-card'),
    missionTracker: { recordEvent: () => undefined },
    techBoard: null,
    solarSystem: null,
    alienState: null,
  } as unknown as IGame;
}

describe('GovernmentFunding', () => {
  it('loads expected card metadata', () => {
    const card = new GovernmentFunding();

    expect(card.id).toBe('93');
    expect(card.income).toBe(EResource.CREDIT);
  });

  it('scores three points for each tucked credit income and tucks itself', () => {
    const card = new GovernmentFunding();
    const player = createPlayer();
    const game = createGame();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.score).toBe(8);
    expect(player.income.tuckedCardIncome[EResource.CREDIT]).toBe(1);
    expect(player.tuckedIncomeCards).toEqual(['108', '90', '93']);
  });

  it('moves the played card instance to income instead of discard and gains immediate credit income', () => {
    const playedCard = {
      id: '93',
      income: EResource.CREDIT,
      instanceId: 'played-government-funding',
    };
    const player = createPlayer();
    const game = createGame();
    player.hand = [playedCard];
    const creditsBefore = player.resources.credits;

    const result = PlayCardAction.execute(player, game, 0);
    game.deferredActions.drain(game);

    expect(result.destination).toBe('income');
    expect(player.hand).toEqual([]);
    expect(player.score).toBe(8);
    expect(player.resources.credits).toBe(creditsBefore - 3 + 1);
    expect(player.income.tuckedCardIncome[EResource.CREDIT]).toBe(1);
    expect(player.tuckedIncomeCards).toEqual(['108', '90', playedCard]);
    expect(game.mainDeck.getDiscardPile()).toEqual([]);
  });
});
