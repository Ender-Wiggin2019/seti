import { Deck } from '@/engine/deck/Deck.js';
import { RefillCardRowEffect } from '@/engine/effects/cardRow/RefillCardRowEffect.js';
import { stubTurnLockFields } from '../../../helpers/stubTurnLock.js';

describe('RefillCardRowEffect', () => {
  it('fills card row to target size', () => {
    const game = {
      ...stubTurnLockFields(),
      cardRow: ['a'],
      mainDeck: new Deck(['b', 'c', 'd']),
    };

    const result = RefillCardRowEffect.execute(game as never, 3);

    expect(result.cardsAdded).toBe(2);
    expect(game.cardRow).toEqual(['a', 'b', 'c']);
  });
});
