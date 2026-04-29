import { ESector } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { Sector } from '@/engine/board/Sector.js';
import { SquareKilometreArray } from '@/engine/cards/base/SquareKilometreArrayCard.js';
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

function createSector(id: string, color: ESector): Sector {
  return new Sector({
    id,
    color,
    positionRewards: [0, 0, 0, 0, 0],
  });
}

function createGame(): IGame {
  return {
    sectors: [
      createSector('red-sector', ESector.RED),
      createSector('blue-sector', ESector.BLUE),
    ],
    cardRow: [
      { id: 'row-red-a', sector: ESector.RED },
      { id: 'row-red-b', sector: ESector.RED },
      { id: 'row-blue', sector: ESector.BLUE },
    ],
    mainDeck: new Deck<string>([]),
    deferredActions: new DeferredActionsQueue(),
    missionTracker: { recordEvent: () => undefined },
    lockCurrentTurn: () => undefined,
  } as unknown as IGame;
}

describe('SquareKilometreArray', () => {
  it('loads expected card metadata', () => {
    const card = new SquareKilometreArray();
    expect(card.id).toBe('50');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('resolves before same-turn completion checks', () => {
    const player = createPlayer();
    const game = createGame();
    const card = new SquareKilometreArray();

    card.play({ player, game });

    expect(game.deferredActions.peek()?.priority).toBe(EPriority.CORE_EFFECT);
  });

  it('scores 2 VP per unique sector actually marked from the card row', () => {
    const player = createPlayer();
    const game = createGame();
    const card = new SquareKilometreArray();
    const scoreBefore = player.score;

    card.play({ player, game });
    const firstInput = game.deferredActions.drain(game);
    expect(firstInput?.toModel().type).toBe(EPlayerInputType.CARD);

    const secondInput = firstInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['row-red-a@0'],
    });
    expect(secondInput?.toModel().type).toBe(EPlayerInputType.CARD);

    const thirdInput = secondInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['row-red-b@0'],
    });
    expect(thirdInput?.toModel().type).toBe(EPlayerInputType.CARD);

    const done = thirdInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['row-blue@0'],
    });

    expect(done).toBeUndefined();
    expect(player.score).toBe(scoreBefore + 4);
    expect(game.sectors[0].getPlayerMarkerCount(player.id)).toBe(2);
    expect(game.sectors[1].getPlayerMarkerCount(player.id)).toBe(1);
  });
});
