import { EResource } from '@seti/common/types/element';
import { PlayCardAction } from '@/engine/actions/PlayCard.js';
import { FusionReactor } from '@/engine/cards/base/FusionReactorCard.js';
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
    resources: { energy: 0 },
    tuckedIncomeCards: ['119', '90'],
  });
}

function createGame(): IGame {
  return {
    ...stubTurnLockFields(),
    mainDeck: new Deck<string>([]),
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('fusion-reactor-card'),
    missionTracker: { recordEvent: () => undefined },
    techBoard: null,
    solarSystem: null,
    alienState: null,
  } as unknown as IGame;
}

describe('FusionReactor', () => {
  it('loads expected card metadata', () => {
    const card = new FusionReactor();

    expect(card.id).toBe('91');
    expect(card.income).toBe(EResource.ENERGY);
  });

  it('gains energy for tucked energy income and tucks itself for income', () => {
    const card = new FusionReactor();
    const player = createPlayer();
    const game = createGame();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.resources.energy).toBe(2);
    expect(player.income.tuckedCardIncome[EResource.ENERGY]).toBe(1);
    expect(player.tuckedIncomeCards).toEqual(['119', '90', '91']);
  });

  it('moves the played card instance to income instead of discard', () => {
    const playedCard = {
      id: '91',
      income: EResource.ENERGY,
      instanceId: 'played-fusion-reactor',
    };
    const player = createPlayer();
    const game = createGame();
    player.hand = [playedCard];

    const result = PlayCardAction.execute(player, game, 0);
    game.deferredActions.drain(game);

    expect(result.destination).toBe('income');
    expect(player.hand).toEqual([]);
    expect(player.resources.energy).toBe(2);
    expect(player.income.tuckedCardIncome[EResource.ENERGY]).toBe(1);
    expect(player.tuckedIncomeCards).toEqual(['119', '90', playedCard]);
    expect(game.mainDeck.getDiscardPile()).toEqual([]);
  });
});
