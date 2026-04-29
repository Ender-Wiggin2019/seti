import { ESector } from '@seti/common/types/element';
import { PlatoCard } from '@/engine/cards/base/PlatoCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createSector(color: ESector, index: number) {
  const state = { marks: 0 };
  return {
    id: `sector-${index}`,
    color,
    completed: false,
    markSignal: () => {
      state.marks += 1;
      return { dataGained: true, vpAwarded: 0 };
    },
    state,
  };
}

describe('PlatoCard (card 118)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new PlatoCard();

    expect(card.id).toBe('118');
    expect(card.behavior.custom).toBeUndefined();
  });

  it('marks three signals in a sector with the player probe without gaining data', () => {
    const card = new PlatoCard();
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    });
    const targetSector = createSector(ESector.YELLOW, 1);
    const game = {
      sectors: [createSector(ESector.RED, 0), targetSector],
      mainDeck: new Deck<string>([]),
      cardRow: [],
      deferredActions: new DeferredActionsQueue(),
      missionTracker: { recordEvent: () => undefined },
      solarSystem: {
        spaces: [
          { id: 'earth', ringIndex: 0, indexInRing: 0, occupants: [] },
          {
            id: 'probe-space',
            ringIndex: 1,
            indexInRing: 1,
            occupants: [{ playerId: player.id }],
          },
        ],
        getSectorIndexOfSpace: (spaceId: string) =>
          spaceId === 'probe-space' ? 1 : null,
      },
    } as unknown as IGame & { sectors: ReturnType<typeof createSector>[] };
    const dataBefore = player.resources.data;

    card.play({ player, game });
    const input = game.deferredActions.drain(game);

    expect(input).toBeUndefined();
    expect(targetSector.state.marks).toBe(3);
    expect(player.resources.data).toBe(dataBefore);
  });
});
