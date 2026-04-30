import { ETrace } from '@seti/common/types/element';
import { SetiAtHome } from '@/engine/cards/base/SetiAtHomeCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { stubTurnLockFields } from '../../../helpers/stubTurnLock.js';

function createPlayer(publicity: number): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { publicity },
  });
}

function createGame(player: Player): IGame {
  return {
    ...stubTurnLockFields(),
    mainDeck: new Deck<string>([]),
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('seti-at-home-card'),
    missionTracker: { recordEvent: () => undefined },
    techBoard: null,
    solarSystem: null,
    alienState: null,
    markTrace: (traceColor: ETrace) => {
      player.traces[traceColor] = (player.traces[traceColor] ?? 0) + 1;
      return undefined;
    },
  } as unknown as IGame;
}

describe('SetiAtHome', () => {
  it('loads expected card metadata', () => {
    const card = new SetiAtHome();

    expect(card.id).toBe('108');
  });

  it('marks a red trace when player has at least eight publicity', () => {
    const card = new SetiAtHome();
    const player = createPlayer(8);
    const game = createGame(player);

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.traces[ETrace.RED]).toBe(1);
  });

  it('does not mark a red trace below eight publicity', () => {
    const card = new SetiAtHome();
    const player = createPlayer(7);
    const game = createGame(player);

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.traces[ETrace.RED]).toBe(0);
  });
});
