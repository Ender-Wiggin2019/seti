import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource, ESector } from '@seti/common/types/element';
import { Card } from '@/engine/cards/Card.js';
import type { ICardRuntimeContext } from '@/engine/cards/ICard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

class TestCard extends Card {
  public canPlayHookCalls = 0;
  public playHookCalls = 0;
  public shouldAllowBespokePlay = true;

  protected override bespokeCanPlay(_context: ICardRuntimeContext): boolean {
    this.canPlayHookCalls += 1;
    return this.shouldAllowBespokePlay;
  }

  protected override bespokePlay(
    _context: ICardRuntimeContext,
  ): ReturnType<Card['play']> {
    this.playHookCalls += 1;
    return undefined;
  }
}

function createCardData(overrides: Partial<IBaseCard> = {}): IBaseCard {
  return {
    id: 'test-card',
    name: 'Test Card',
    price: 1,
    income: EResource.CREDIT,
    effects: [],
    sector: ESector.BLUE,
    ...overrides,
  };
}

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 4, energy: 3, publicity: 4 },
    ...overrides,
  });
}

function createGame(): IGame {
  return {
    sectors: [],
    mainDeck: new Deck<string>(['deck-a', 'deck-b']),
    cardRow: ['row-1', 'row-2', 'row-3'],
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('card-test-seed'),
  } as unknown as IGame;
}

describe('Card', () => {
  it('runs template-method canPlay pipeline and calls bespokeCanPlay last', () => {
    const card = new TestCard(createCardData(), {
      requirements: { resources: { credits: 2 } },
    });
    const context = { player: createPlayer(), game: createGame() };

    const canPlay = card.canPlay(context);

    expect(canPlay).toBe(true);
    expect(card.canPlayHookCalls).toBe(1);
  });

  it('returns false when requirements are not met', () => {
    const card = new TestCard(createCardData(), {
      requirements: { resources: { credits: 9 } },
    });
    const context = { player: createPlayer(), game: createGame() };

    const canPlay = card.canPlay(context);

    expect(canPlay).toBe(false);
    expect(card.canPlayHookCalls).toBe(0);
  });

  it('queues behavior and executes it when deferred queue drains', () => {
    const card = new TestCard(createCardData(), {
      behavior: {
        gainResources: { energy: 2 },
      },
    });
    const player = createPlayer({ resources: { credits: 4, energy: 0 } });
    const game = createGame();
    const context = { player, game };

    card.play(context);
    game.deferredActions.drain(game);

    expect(player.resources.energy).toBe(2);
    expect(card.playHookCalls).toBe(1);
  });

  it('returns bespokePlay result', () => {
    class InputCard extends TestCard {
      protected override bespokePlay(_context: ICardRuntimeContext) {
        return new SelectOption(createPlayer(), [
          {
            label: 'ok',
            onSelect: () => undefined,
          },
        ]);
      }
    }

    const card = new InputCard(createCardData());
    const context = { player: createPlayer(), game: createGame() };
    const result = card.play(context);

    expect(result).toBeDefined();
  });
});
