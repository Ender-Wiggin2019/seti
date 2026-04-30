import { ESector } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { PlanetHuntersCard } from '@/engine/cards/base/PlanetHuntersCard.js';
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

describe('PlanetHuntersCard (card 114)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new PlanetHuntersCard();

    expect(card.id).toBe('114');
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.drawCards).toBe(1);
  });

  it('draws a card, then optionally discards up to three hand cards for matching signals', () => {
    const card = new PlanetHuntersCard();
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
      hand: [
        { id: 'hand-red', sector: ESector.RED },
        { id: 'hand-blue', sector: ESector.BLUE },
      ],
    });
    const sectors = [createSector(ESector.RED), createSector(ESector.BLUE)];
    const game = {
      sectors,
      mainDeck: new Deck<string>(['drawn-card']),
      cardRow: [],
      deferredActions: new DeferredActionsQueue(),
      missionTracker: { recordEvent: () => undefined },
      random: { shuffle: (items: string[]) => items },
      lockCurrentTurn: () => undefined,
    } as unknown as IGame;

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    expect(input?.type).toBe(EPlayerInputType.CARD);

    input?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['hand-red@0', 'hand-blue@1'],
    });

    expect(player.hand).toEqual(['drawn-card']);
    expect(game.mainDeck.getDiscardPile()).toEqual(['hand-red', 'hand-blue']);
    expect(sectors[0].state.marks).toBe(1);
    expect(sectors[1].state.marks).toBe(1);
  });
});
