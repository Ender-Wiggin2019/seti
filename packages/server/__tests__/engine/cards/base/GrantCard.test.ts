import { EResource } from '@seti/common/types/element';
import { GrantCard } from '@/engine/cards/base/GrantCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { data: 0 },
  });
}

function createGame(): IGame {
  return {
    cardRow: [],
    mainDeck: new Deck<string>(['99']),
    deferredActions: new DeferredActionsQueue(),
    missionTracker: { recordEvent: () => undefined },
    random: new SeededRandom('grant-test'),
    lockCurrentTurn: () => undefined,
  } as unknown as IGame;
}

describe('GrantCard (card 11)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new GrantCard();

    expect(card.id).toBe('11');
    expect(card.freeAction?.[0].type).toBe(EResource.PUBLICITY);
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.drawCards).toBeUndefined();
  });

  it('draws one card and gains the drawn card free-action corner reward', () => {
    const card = new GrantCard();
    const player = createPlayer();
    const game = createGame();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.hand).toEqual(['99']);
    expect(player.resources.data).toBe(1);
  });
});
