import { EResource } from '@seti/common/types/element';
import { FuelTanksConstruction } from '@/engine/cards/base/FuelTanksConstructionCard.js';
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
    hand: ['91', '119', '90', 'unknown-card'],
  });
}

function createGame(): IGame {
  return {
    ...stubTurnLockFields(),
    mainDeck: new Deck<string>([]),
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('fuel-tanks-construction-card'),
    missionTracker: { recordEvent: () => undefined },
    techBoard: null,
    solarSystem: null,
    alienState: null,
  } as unknown as IGame;
}

describe('FuelTanksConstruction', () => {
  it('loads expected card metadata', () => {
    const card = new FuelTanksConstruction();

    expect(card.id).toBe('90');
    expect(card.income).toBe(EResource.CARD);
  });

  it('gains energy for each energy-income card in hand', () => {
    const card = new FuelTanksConstruction();
    const player = createPlayer();
    const game = createGame();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.resources.energy).toBe(2);
  });
});
