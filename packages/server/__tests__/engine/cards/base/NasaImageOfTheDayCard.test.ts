import { EResource } from '@seti/common/types/element';
import { PlayCardAction } from '@/engine/actions/PlayCard.js';
import { NasaImageOfTheDay } from '@/engine/cards/base/NasaImageOfTheDayCard.js';
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
    resources: { publicity: 0 },
    tuckedIncomeCards: ['90', '91'],
  });
}

function createGame(): IGame {
  return {
    ...stubTurnLockFields(),
    mainDeck: new Deck<string>([]),
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('nasa-image-of-the-day-card'),
    missionTracker: { recordEvent: () => undefined },
    techBoard: null,
    solarSystem: null,
    alienState: null,
  } as unknown as IGame;
}

describe('NasaImageOfTheDay', () => {
  it('loads expected card metadata', () => {
    const card = new NasaImageOfTheDay();

    expect(card.id).toBe('92');
    expect(card.income).toBe(EResource.CARD);
  });

  it('gains base publicity plus publicity for tucked card income and tucks itself', () => {
    const card = new NasaImageOfTheDay();
    const player = createPlayer();
    const game = createGame();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.resources.publicity).toBe(3);
    expect(player.income.tuckedCardIncome[EResource.CARD]).toBe(1);
    expect(player.tuckedIncomeCards).toEqual(['90', '91', '92']);
  });

  it('moves the played card instance to income instead of discard and draws immediate card income', () => {
    const playedCard = {
      id: '92',
      income: EResource.CARD,
      instanceId: 'played-nasa-image',
    };
    const player = createPlayer();
    const game = createGame();
    game.mainDeck = new Deck<string>(['drawn-for-card-income']);
    player.hand = [playedCard];

    const result = PlayCardAction.execute(player, game, 0);
    game.deferredActions.drain(game);

    expect(result.destination).toBe('income');
    expect(player.resources.publicity).toBe(3);
    expect(player.hand).toEqual(['drawn-for-card-income']);
    expect(player.income.tuckedCardIncome[EResource.CARD]).toBe(1);
    expect(player.tuckedIncomeCards).toEqual(['90', '91', playedCard]);
    expect(game.mainDeck.getDiscardPile()).toEqual([]);
  });
});
