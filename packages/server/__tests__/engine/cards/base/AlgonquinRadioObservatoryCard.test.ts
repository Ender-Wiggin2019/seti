import { ESector } from '@seti/common/types/element';
import { AlgonquinRadioObservatoryCard } from '@/engine/cards/base/AlgonquinRadioObservatoryCard.js';
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
      return { dataGained: true, vpAwarded: 0 };
    },
    state,
  };
}

describe('AlgonquinRadioObservatoryCard (card 136)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new AlgonquinRadioObservatoryCard();

    expect(card.id).toBe('136');
    expect(card.behavior.custom).toBeUndefined();
  });

  it('marks one signal of each color without gaining data from those signals', () => {
    const card = new AlgonquinRadioObservatoryCard();
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    });
    const sectors = [
      createSector(ESector.YELLOW),
      createSector(ESector.RED),
      createSector(ESector.BLUE),
      createSector(ESector.BLACK),
    ];
    const game = {
      sectors,
      mainDeck: new Deck<string>([]),
      cardRow: [],
      deferredActions: new DeferredActionsQueue(),
      missionTracker: { recordEvent: () => undefined },
    } as unknown as IGame;
    const dataBefore = player.resources.data;

    card.play({ player, game });
    const input = game.deferredActions.drain(game);

    expect(input).toBeUndefined();
    expect(sectors.map((sector) => sector.state.marks)).toEqual([1, 1, 1, 1]);
    expect(player.resources.data).toBe(dataBefore);
  });
});
