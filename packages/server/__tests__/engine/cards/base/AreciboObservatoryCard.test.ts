import { ESector } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { AreciboObservatoryCard } from '@/engine/cards/base/AreciboObservatoryCard.js';
import { type EMarkSource, Mark } from '@/engine/cards/utils/Mark.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EScanSubAction } from '@/engine/effects/scan/ScanActionPool.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

type TTestSector = ReturnType<typeof createSector>;
type TTestGame = IGame & { sectors: TTestSector[] };

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
  });
}

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

function createGame(
  player: Player,
  options: {
    earthSectorIndex?: number;
    cardRow?: IGame['cardRow'];
  } = {},
): TTestGame {
  const game = {
    sectors: [
      createSector(ESector.RED, 0),
      createSector(ESector.YELLOW, 1),
      createSector(ESector.BLUE, 2),
      createSector(ESector.BLACK, 3),
    ],
    cardRow: options.cardRow ?? [{ id: 'row-blue', sector: ESector.BLUE }],
    mainDeck: new Deck<string>(['refill-a', 'refill-b', 'refill-c']),
    deferredActions: new DeferredActionsQueue(),
    missionTracker: { recordEvent: () => undefined },
    lockCurrentTurn: () => undefined,
    solarSystem: {
      getSectorIndexOfPlanet: (planet: EPlanet) =>
        planet === EPlanet.EARTH ? (options.earthSectorIndex ?? 0) : null,
    },
    mark: (source: EMarkSource, count: number) =>
      Mark.execute(player, game as IGame, source, count),
  } as unknown as TTestGame;
  return game;
}

describe('AreciboObservatory (card 55)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new AreciboObservatoryCard();

    expect(card.id).toBe('55');
    expect(card.behavior.custom).toBeUndefined();
  });

  it('performs scan from the card row and then prompts for one additional any signal', () => {
    const card = new AreciboObservatoryCard();
    const player = createPlayer();
    const game = createGame(player);

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
      cardIds: ['row-blue'],
    });
    const nextInput = afterCardRow;

    expect(game.sectors[0].state.marks).toBe(1);
    expect(game.sectors[2].state.marks).toBe(1);
    expect(game.mainDeck.getDiscardPile()).toEqual(['row-blue']);
    expect(nextInput?.type).toBe(EPlayerInputType.OPTION);
    expect(nextInput?.toModel().title).toBe('Choose signal color to mark');

    const done = nextInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'any-signal-red',
    });

    expect(done).toBeUndefined();
    expect(game.cardRow).toEqual(['refill-a', 'refill-b', 'refill-c']);
  });

  it('marks the current Earth sector when scanning', () => {
    const card = new AreciboObservatoryCard();
    const player = createPlayer();
    const game = createGame(player, { cardRow: [], earthSectorIndex: 2 });

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const nextInput = input?.process({
      type: EPlayerInputType.OPTION,
      optionId: EScanSubAction.MARK_EARTH,
    });

    expect(game.sectors[0].state.marks).toBe(0);
    expect(game.sectors[2].state.marks).toBe(1);
    expect(nextInput?.type).toBe(EPlayerInputType.OPTION);
  });
});
