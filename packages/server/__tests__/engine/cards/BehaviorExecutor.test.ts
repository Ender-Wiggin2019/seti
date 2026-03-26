import { EResource, ESector } from '@seti/common/types/element';
import type { IBehavior } from '@/engine/cards/Behavior.js';
import { BehaviorExecutor } from '@/engine/cards/BehaviorExecutor.js';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 4, energy: 3, publicity: 4 },
    ...overrides,
  });
}

function createGame(): IGame {
  return {
    sectors: [
      {
        id: 'sector-earth',
        color: ESector.RED,
        completed: false,
        markSignal: () => ({ dataGained: null, vpGained: 0 }),
      },
    ],
    mainDeck: new Deck<string>(['d1', 'd2', 'd3']),
    cardRow: ['row-1', 'row-2', 'row-3'],
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('behavior-executor-test'),
    solarSystem: {
      rotateNextDisc: () => 0,
    },
    techBoard: {
      getAvailableTechs: () => [],
    },
  } as unknown as IGame;
}

describe('BehaviorExecutor', () => {
  it('applies gainResources and spendResources through deferred actions', () => {
    const executor = new BehaviorExecutor();
    const player = createPlayer({ resources: { credits: 5, energy: 3 } });
    const game = createGame();
    const card = getCardRegistry().create('55');

    const behavior: IBehavior = {
      spendResources: { credits: 2 },
      gainResources: { energy: 1 },
    };
    executor.execute(behavior, player, game, card);
    game.deferredActions.drain(game);

    expect(player.resources.credits).toBe(3);
    expect(player.resources.energy).toBe(4);
  });

  it('draws cards from main deck into hand', () => {
    const executor = new BehaviorExecutor();
    const player = createPlayer({ hand: [] });
    const game = createGame();
    const card = getCardRegistry().create('55');

    executor.execute({ drawCards: 2 }, player, game, card);
    game.deferredActions.drain(game);

    expect(player.hand).toEqual(['d1', 'd2']);
  });

  it('handles composite behavior fields in one execution', () => {
    const executor = new BehaviorExecutor();
    const player = createPlayer({ resources: { credits: 3, energy: 0 } });
    const game = createGame();
    const card = getCardRegistry().create('55');

    executor.execute(
      {
        spendResources: { credits: 1 },
        gainResources: { energy: 2 },
        gainScore: 3,
        gainMovement: 1,
        gainIncome: EResource.ENERGY,
        rotateSolarSystem: true,
      },
      player,
      game,
      card,
    );
    game.deferredActions.drain(game);

    expect(player.resources.credits).toBe(2);
    expect(player.resources.energy).toBe(2);
    expect(player.score).toBe(4);
    expect(player.getMoveStash()).toBe(1);
    expect(player.income.tuckedCardIncome[EResource.ENERGY]).toBe(1);
  });
});
