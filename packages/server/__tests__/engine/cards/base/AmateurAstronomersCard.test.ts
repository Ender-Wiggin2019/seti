import { ESector } from '@seti/common/types/element';
import { AmateurAstronomersCard } from '@/engine/cards/base/AmateurAstronomersCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createSector(color: ESector) {
  const state = { marks: 0 };
  return {
    id: `sector-${color}`,
    color,
    completed: false,
    markSignal: () => {
      state.marks += 1;
      return { dataGained: false, vpAwarded: 0 };
    },
    state,
  };
}

describe('AmateurAstronomersCard (card 122)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new AmateurAstronomersCard();

    expect(card.id).toBe('122');
    expect(card.behavior.custom).toBeUndefined();
  });

  it('discards the top three deck cards and marks signals matching their sectors', () => {
    const card = new AmateurAstronomersCard();
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    });
    const sectors = [createSector(ESector.YELLOW), createSector(ESector.BLUE)];
    const game = {
      sectors,
      mainDeck: new Deck<string>(['52', '53', '118']),
      cardRow: [],
      deferredActions: new DeferredActionsQueue(),
      missionTracker: { recordEvent: () => undefined },
      random: { shuffle: (items: string[]) => items },
    } as unknown as IGame;

    card.play({ player, game });
    const input = game.deferredActions.drain(game);

    expect(input).toBeUndefined();
    expect(game.mainDeck.getDiscardPile()).toEqual(['52', '53', '118']);
    expect(sectors[0].state.marks).toBe(2);
    expect(sectors[1].state.marks).toBe(1);
  });
});
