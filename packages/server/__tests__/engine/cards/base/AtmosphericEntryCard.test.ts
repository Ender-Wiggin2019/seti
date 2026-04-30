import { EPlanet } from '@seti/common/types/protocol/enums';
import { PlanetaryBoard } from '@/engine/board/PlanetaryBoard.js';
import { AtmosphericEntryCard } from '@/engine/cards/base/AtmosphericEntryCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import type { IGame } from '@/engine/IGame.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createPlayer(): Player {
  const player = new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { data: 0 },
  });
  player.pieces.deploy(EPieceType.ORBITER);
  return player;
}

function createGame(player: Player): IGame {
  const planetaryBoard = new PlanetaryBoard();
  planetaryBoard.planets.get(EPlanet.VENUS)?.orbitSlots.push({
    playerId: player.id,
  });
  return {
    cardRow: [],
    mainDeck: new Deck<string>(['55']),
    deferredActions: new DeferredActionsQueue(),
    planetaryBoard,
    random: new SeededRandom('atmospheric-entry'),
    lockCurrentTurn: () => undefined,
  } as unknown as IGame;
}

describe('AtmosphericEntryCard (card 15)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new AtmosphericEntryCard();

    expect(card.id).toBe('15');
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.gainScore).toBeUndefined();
    expect(card.behavior.gainResources).toBeUndefined();
    expect(card.behavior.drawCards).toBeUndefined();
  });

  it('removes one own orbiter to gain 3 VP, 1 data, and 1 card', () => {
    const card = new AtmosphericEntryCard();
    const player = createPlayer();
    const game = createGame(player);
    const scoreBefore = player.score;

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(
      game.planetaryBoard?.planets.get(EPlanet.VENUS)?.orbitSlots,
    ).toHaveLength(0);
    expect(player.pieces.deployed(EPieceType.ORBITER)).toBe(0);
    expect(player.score).toBe(scoreBefore + 3);
    expect(player.resources.data).toBe(1);
    expect(player.hand).toEqual(['55']);
  });
});
