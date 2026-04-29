import { ESector } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { YevpatoriaTelescopeCard } from '@/engine/cards/base/YevpatoriaTelescopeCard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

type TTestSector = ReturnType<typeof createSector>;
type TTestGame = IGame & { blueSector: TTestSector };

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    hand: [
      { id: 'hand-blue', sector: ESector.BLUE },
      { id: 'hand-red', sector: ESector.RED },
    ],
  });
}

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

function createGame(options: { availableTechs?: ETechId[] } = {}): TTestGame {
  const blueSector = createSector(ESector.BLUE);
  return {
    sectors: [createSector(ESector.RED), blueSector],
    mainDeck: new Deck<string>([]),
    deferredActions: new DeferredActionsQueue(),
    missionTracker: { recordEvent: () => undefined },
    techBoard: {
      getAvailableTechs: () =>
        options.availableTechs ?? [ETechId.SCAN_EARTH_LOOK],
      canResearch: () => true,
      take: () => ({
        vpBonus: 0,
        tile: { tech: { type: 'scan-tech' }, bonus: undefined },
      }),
    },
    alienState: { onSolarSystemRotated: () => undefined },
    rotationCounter: 0,
    solarSystem: { rotateNextDisc: () => 0 },
    blueSector,
  } as unknown as TTestGame;
}

describe('YevpatoriaTelescopeCard (card 67)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new YevpatoriaTelescopeCard();

    expect(card.id).toBe('67');
    expect(card.behavior.custom).toBeUndefined();
  });

  it('discards one selected hand card and marks a signal of that card color', () => {
    const card = new YevpatoriaTelescopeCard();
    const player = createPlayer();
    const game = createGame();
    const initialPublicity = player.resources.publicity;

    card.play({ player, game });
    const input = game.deferredActions.drain(game);

    expect(input?.type).toBe(EPlayerInputType.OPTION);
    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'discard-hand-blue@0',
    });

    expect(player.hand).toHaveLength(1);
    expect(game.mainDeck.getDiscardPile()).toEqual(['hand-blue']);
    expect(game.blueSector.state.marks).toBe(1);
    expect(player.techs).toContain(ETechId.SCAN_EARTH_LOOK);
    expect(player.resources.publicity).toBe(initialPublicity + 1);
  });

  it('can skip unavailable scan tech and optional hand discard', () => {
    const card = new YevpatoriaTelescopeCard();
    const player = createPlayer();
    const game = createGame({ availableTechs: [] });

    expect(card.canPlay({ player, game })).toBe(true);

    card.play({ player, game });
    const input = game.deferredActions.drain(game);

    expect(input?.type).toBe(EPlayerInputType.OPTION);
    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'skip-hand-signal',
    });

    expect(player.hand).toHaveLength(2);
    expect(player.techs).toHaveLength(0);
    expect(game.blueSector.state.marks).toBe(0);
  });
});
