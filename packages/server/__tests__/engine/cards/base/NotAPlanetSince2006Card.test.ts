import { EMainAction } from '@seti/common/types/protocol/enums';
import { NotAPlanetSince2006Card } from '@/engine/cards/base/NotAPlanetSince2006Card.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('NotAPlanetSince2006Card (SE EN 01)', () => {
  it('loads as an intentionally disabled no-op card without custom runtime behavior', () => {
    const card = new NotAPlanetSince2006Card();

    expect(card.id).toBe('SE EN 01');
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
    expect(card.behavior).toEqual({});
    expect(card.behavior.custom).toBeUndefined();
  });

  it('plays without emitting an unhandled custom effect event', () => {
    const game = buildTestGame({ seed: 'se-en-01-disabled' });
    const player = getPlayer(game, 'p1');
    const eventsBefore = game.eventLog.size();
    player.hand = ['SE EN 01'];

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    const newEvents = game.eventLog.toArray().slice(eventsBefore);
    expect(player.hand).toEqual([]);
    expect(game.mainDeck.getDiscardPile()).toContain('SE EN 01');
    expect(
      newEvents.some(
        (event) =>
          event.type === 'ACTION' &&
          event.action === 'CARD_CUSTOM_EFFECT_UNHANDLED',
      ),
    ).toBe(false);
  });
});
