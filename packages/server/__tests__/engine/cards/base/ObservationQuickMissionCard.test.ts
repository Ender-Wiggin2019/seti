import { createDefaultSetupConfig } from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { vi } from 'vitest';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 10, energy: 3, publicity: 4, data: 0 },
  });
}

function createGame(sectors: unknown[], withSetup = true): IGame {
  return {
    sectors,
    solarSystemSetup: withSetup ? createDefaultSetupConfig() : null,
    mainDeck: new Deck<string>([]),
    cardRow: [],
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('observation-quick-mission-test'),
  } as unknown as IGame;
}

describe('ObservationQuickMissionCard (37/39/41/43)', () => {
  it('places signals in the star-matched sector instead of first same-color sector', () => {
    const targetRedSector = {
      id: 'sector-5', // Proxima Centauri in default setup
      color: ESector.RED,
      completed: false,
      markSignal: vi.fn(() => ({ dataGained: null, vpGained: 0 })),
    };
    const otherRedSector = {
      id: 'sector-3',
      color: ESector.RED,
      completed: false,
      markSignal: vi.fn(() => ({ dataGained: null, vpGained: 0 })),
    };

    const player = createPlayer();
    const game = createGame([otherRedSector, targetRedSector]);
    const card = getCardRegistry().create('37');

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(targetRedSector.markSignal).toHaveBeenCalledTimes(2);
    expect(otherRedSector.markSignal).not.toHaveBeenCalled();
  });

  it('falls back to color-based signal placement when setup config is missing', () => {
    const firstYellowSector = {
      id: 'sector-a',
      color: ESector.YELLOW,
      completed: false,
      markSignal: vi.fn(() => ({ dataGained: null, vpGained: 0 })),
    };
    const secondYellowSector = {
      id: 'sector-b',
      color: ESector.YELLOW,
      completed: false,
      markSignal: vi.fn(() => ({ dataGained: null, vpGained: 0 })),
    };

    const player = createPlayer();
    const game = createGame([firstYellowSector, secondYellowSector], false);
    const card = getCardRegistry().create('39');

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(firstYellowSector.markSignal).toHaveBeenCalledTimes(2);
    expect(secondYellowSector.markSignal).not.toHaveBeenCalled();
  });
});
