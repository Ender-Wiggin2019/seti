import { ESector, ETrace } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 10, energy: 3, publicity: 4 },
    hand: [],
    ...overrides,
  });
}

function createMarkableSector(color: ESector) {
  const state = { marks: 0 };
  return {
    id: `sector-${color}`,
    color,
    completed: false,
    markSignal: () => {
      state.marks += 1;
      return { dataGained: null, vpGained: 0 };
    },
    state,
  };
}

function createGame(overrides: Record<string, unknown> = {}): IGame {
  return {
    sectors: [],
    mainDeck: new Deck<string>([]),
    cardRow: [],
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('base-card-tests'),
    ...overrides,
  } as unknown as IGame;
}

describe('Base representative cards', () => {
  it('Card 85 is registered as dedicated class', () => {
    const card = getCardRegistry().create('85');
    expect(card.id).toBe('85');
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
    expect(
      card.effects.map((effect) => effect.effectType).length,
    ).toBeGreaterThan(0);
  });

  it('Card 50 marks signal from displayed cards without using scan action', () => {
    const redSector = createMarkableSector(ESector.RED);
    const yellowSector = createMarkableSector(ESector.YELLOW);
    const blueSector = createMarkableSector(ESector.BLUE);
    const player = createPlayer();
    const game = createGame({
      sectors: [redSector, yellowSector, blueSector],
      // Use string IDs to verify the card resolves sector colors via loadCardData.
      cardRow: ['85', '55', '50'],
    });
    const card = getCardRegistry().create('50');

    card.play({ player, game });
    let pendingInput = game.deferredActions.drain(game);
    expect(pendingInput?.type).toBe(EPlayerInputType.CARD);

    pendingInput = pendingInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['85@0'],
    } as never);
    expect(pendingInput?.type).toBe(EPlayerInputType.CARD);

    pendingInput = pendingInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['55@1'],
    } as never);
    expect(pendingInput?.type).toBe(EPlayerInputType.CARD);

    pendingInput = pendingInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['50@2'],
    } as never);
    expect(pendingInput).toBeUndefined();

    expect(redSector.state.marks).toBe(1);
    expect(blueSector.state.marks).toBe(1);
    expect(yellowSector.state.marks).toBe(1);
  });

  it('Card 106 supports spend-2 branch with deck draw and row selection input', () => {
    const playerDeckPath = createPlayer({ resources: { credits: 4 } });
    const gameDeckPath = createGame({
      mainDeck: new Deck<string>(['deck-card-1']),
      cardRow: ['55', '85'],
    });
    const cardDeckPath = getCardRegistry().create('106');

    cardDeckPath.play({ player: playerDeckPath, game: gameDeckPath });
    let deckPathInput = gameDeckPath.deferredActions.drain(gameDeckPath);
    expect(deckPathInput?.type).toBe(EPlayerInputType.OPTION);
    deckPathInput = deckPathInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'spend-2',
    } as never);
    expect(deckPathInput?.type).toBe(EPlayerInputType.OPTION);
    deckPathInput = deckPathInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'draw-deck',
    } as never);
    expect(deckPathInput).toBeUndefined();
    expect(playerDeckPath.hand).toEqual(['deck-card-1']);

    const playerRowPath = createPlayer({ resources: { credits: 4 } });
    const gameRowPath = createGame({
      mainDeck: new Deck<string>(['deck-card-2']),
      cardRow: ['55'],
    });
    const cardRowPath = getCardRegistry().create('106');

    cardRowPath.play({ player: playerRowPath, game: gameRowPath });
    let rowPathInput = gameRowPath.deferredActions.drain(gameRowPath);
    rowPathInput = rowPathInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'spend-2',
    } as never);
    rowPathInput = rowPathInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'select-row',
    } as never);
    expect(rowPathInput?.type).toBe(EPlayerInputType.CARD);
    rowPathInput = rowPathInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['55'],
    } as never);
    expect(rowPathInput).toBeUndefined();
    expect(playerRowPath.hand).toEqual(['55']);
    expect(gameRowPath.cardRow).toEqual(['deck-card-2']);
  });

  it('Card 89 draws cards through behavior executor', () => {
    const player = createPlayer({ hand: [] });
    const game = createGame({
      mainDeck: new Deck<string>(['draw-1', 'draw-2', 'draw-3']),
      cardRow: ['55'],
    });
    const card = getCardRegistry().create('89');

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.hand).toEqual(['draw-1', 'draw-2', 'draw-3']);
  });

  it('Card 75 marks ANY trace once', () => {
    const player = createPlayer();
    const game = createGame();
    const card = getCardRegistry().create('75');

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.traces[ETrace.ANY]).toBe(1);
  });

  it('Card 71 canPlay depends on available tech choices', () => {
    const player = createPlayer();
    const card = getCardRegistry().create('71');

    const gameNoTech = createGame({
      techBoard: {
        getAvailableTechs: () => [],
      },
    });
    expect(card.canPlay({ player, game: gameNoTech })).toBe(false);

    const gameWithTech = createGame({
      techBoard: {
        getAvailableTechs: () => [ETechId.SCAN_EARTH_LOOK],
      },
    });
    expect(card.canPlay({ player, game: gameWithTech })).toBe(true);
  });
});
