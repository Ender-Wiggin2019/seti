import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { AlienState } from '@/engine/alien/AlienState.js';
import { Deck } from '@/engine/deck/Deck.js';
import { drawCard } from '@/engine/deck/drawCard.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createPlayer(id = 'p1'): Player {
  return new Player({ id, name: id, color: 'red', seatIndex: 0 });
}

function createMockGame(overrides: Partial<IGame> = {}): IGame {
  return {
    mainDeck: new Deck<string>([]),
    alienState: AlienState.createFromHiddenAliens([]),
    random: {
      shuffle: <T>(items: T[]) => [...items],
    } as IGame['random'],
    eventLog: new EventLog(),
    lockCurrentTurn: () => undefined,
    players: [],
    ...overrides,
  } as unknown as IGame;
}

describe('drawCard', () => {
  it('draws from base deck and appends to hand', () => {
    const player = createPlayer();
    const game = createMockGame({
      mainDeck: new Deck<string>(['1', '2']),
      players: [player],
    });

    const result = drawCard(player, game, { source: 'base', count: 2 });

    expect(result.drawnCardIds).toEqual(['1', '2']);
    expect(player.hand).toEqual(['1', '2']);
    expect(result.pendingInput).toBeUndefined();
  });

  it('draws remaining card first, then reshuffles discard to continue drawing', () => {
    const player = createPlayer();
    const game = createMockGame({
      mainDeck: new Deck<string>(['last-card'], ['discard-1', 'discard-2']),
      players: [player],
    });

    const result = drawCard(player, game, { source: 'base', count: 2 });

    expect(result.drawnCardIds).toEqual(['last-card', 'discard-1']);
    expect(player.hand).toEqual(['last-card', 'discard-1']);
    expect(game.mainDeck.getDrawPile()).toEqual(['discard-2']);
    expect(game.mainDeck.getDiscardPile()).toEqual([]);
  });

  it('for alien source without type prompts player to choose alien board', () => {
    const player = createPlayer();
    const alienState = AlienState.createFromHiddenAliens([
      EAlienType.ANOMALIES,
      EAlienType.CENTAURIANS,
    ]);
    alienState.boards[0].discovered = true;
    alienState.boards[0].initializeAlienDeck(['ET.11']);
    alienState.boards[1].discovered = true;
    alienState.boards[1].initializeAlienDeck(['ET.31']);
    const game = createMockGame({ alienState, players: [player] });

    const result = drawCard(player, game, { source: 'alien' });

    expect(result.drawnCardIds).toEqual([]);
    expect(result.pendingInput).toBeDefined();
    const model = result.pendingInput!.toModel();
    expect(model.type).toBe(EPlayerInputType.OPTION);
    if (model.type !== EPlayerInputType.OPTION) {
      throw new Error('Expected option input model');
    }
    expect(model.options).toHaveLength(2);
  });

  it('for alien source with type prompts source choice then draws', () => {
    const player = createPlayer();
    const alienState = new AlienState({
      aliens: [
        {
          alienType: EAlienType.ANOMALIES,
          alienIndex: 0,
          discovered: true,
          slots: [
            {
              slotId: 'disc-red',
              alienIndex: 0,
              traceColor: ETrace.RED,
              isDiscovery: true,
            },
          ],
        },
      ],
    });
    const board = alienState.boards[0];
    board.initializeAlienDeck(['ET.11', 'ET.12']);
    board.revealNextFaceUpAlienCard();
    const game = createMockGame({ alienState, players: [player] });

    const result = drawCard(player, game, {
      source: 'alien',
      alienType: EAlienType.ANOMALIES,
    });

    expect(result.pendingInput).toBeDefined();
    const done = result.pendingInput!.process({
      type: EPlayerInputType.OPTION,
      optionId: 'draw-random',
    });

    expect(done).toBeUndefined();
    expect(player.hand).toEqual(['ET.12']);
  });
});
