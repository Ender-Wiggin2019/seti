import { ESector } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { DeepSynopticArrayCard } from '@/engine/cards/base/DeepSynopticArrayCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EScanSubAction } from '@/engine/effects/scan/ScanActionPool.js';
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
      return { dataGained: false, vpAwarded: 0 };
    },
    state,
  };
}

function createGame(_player: Player): {
  game: IGame;
  sectors: ReturnType<typeof createSector>[];
} {
  const sectors = [
    createSector(ESector.RED, 0),
    createSector(ESector.YELLOW, 1),
  ];
  const game = {
    sectors,
    cardRow: [{ id: 'row-yellow', sector: ESector.YELLOW }],
    mainDeck: new Deck<string>(['refill-a', 'refill-b', 'refill-c']),
    deferredActions: new DeferredActionsQueue(),
    missionTracker: { recordEvent: () => undefined },
    lockCurrentTurn: () => undefined,
    solarSystem: {
      getSectorIndexOfPlanet: () => 0,
    },
  } as unknown as IGame;
  return { game, sectors };
}

describe('DeepSynopticArrayCard (card 53)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new DeepSynopticArrayCard();

    expect(card.id).toBe('53');
    expect(card.behavior.custom).toBeUndefined();
  });

  it('performs scan and scores 2 VP for each yellow signal marked by the scan', () => {
    const card = new DeepSynopticArrayCard();
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    });
    const { game, sectors } = createGame(player);
    const scoreBefore = player.score;

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    expect(input?.type).toBe(EPlayerInputType.OPTION);

    const afterEarth = input?.process({
      type: EPlayerInputType.OPTION,
      optionId: EScanSubAction.MARK_EARTH,
    });
    const rowInput = afterEarth?.process({
      type: EPlayerInputType.OPTION,
      optionId: EScanSubAction.MARK_CARD_ROW,
    });
    const afterCardRow = rowInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['row-yellow'],
    });

    expect(afterCardRow).toBeUndefined();
    expect(sectors[0].state.marks).toBe(1);
    expect(sectors[1].state.marks).toBe(1);
    expect(game.mainDeck.getDiscardPile()).toEqual(['row-yellow']);
    expect(game.cardRow).toEqual(['refill-a', 'refill-b', 'refill-c']);
    expect(player.score).toBe(scoreBefore + 2);
  });
});
