import { Dragonfly } from '@/engine/cards/base/DragonflyCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EPriority } from '@/engine/deferred/Priority.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
  });
}

function createGame(): IGame {
  return {
    sectors: [],
    cardRow: [],
    mainDeck: new Deck<string>([]),
    deferredActions: new DeferredActionsQueue(),
    missionTracker: { recordEvent: () => undefined },
  } as unknown as IGame;
}

describe('Dragonfly', () => {
  it('loads expected card metadata', () => {
    const card = new Dragonfly();
    expect(card.id).toBe('16');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('resolves its land effect before same-turn completion checks', () => {
    const player = createPlayer();
    const game = createGame();
    const card = new Dragonfly();

    card.play({ player, game });

    expect(game.deferredActions.peek()?.priority).toBe(EPriority.CORE_EFFECT);
  });
});
