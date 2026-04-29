import { EResource } from '@seti/common/types/element';
import { CleanSpaceInitiativeCard } from '@/engine/cards/base/CleanSpaceInitiativeCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { publicity: 0, data: 0 },
  });
}

function createGame(): IGame {
  return {
    cardRow: ['55', '39', '99'],
    mainDeck: new Deck<string>(['refill-a', 'refill-b', 'refill-c']),
    deferredActions: new DeferredActionsQueue(),
    missionTracker: { recordEvent: () => undefined },
    lockCurrentTurn: () => undefined,
  } as unknown as IGame;
}

describe('CleanSpaceInitiativeCard (card 73)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new CleanSpaceInitiativeCard();

    expect(card.id).toBe('73');
    expect(card.behavior.custom).toBeUndefined();
  });

  it('discards the card row for free-action corner rewards and refills it', () => {
    const card = new CleanSpaceInitiativeCard();
    const player = createPlayer();
    const game = createGame();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.resources.publicity).toBe(1);
    expect(player.resources.data).toBe(1);
    expect(player.getMoveStash()).toBe(1);
    expect(game.mainDeck.getDiscardPile()).toEqual(['55', '39', '99']);
    expect(game.cardRow).toEqual(['refill-a', 'refill-b', 'refill-c']);
  });

  it('does not expose unhandled custom behavior', () => {
    expect(new CleanSpaceInitiativeCard().behavior.custom).toBeUndefined();
  });
});
