import { ALL_CARDS } from '@seti/common/data';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { ImmediateCard } from '@/engine/cards/Card.js';
import { CardRegistry, getCardRegistry } from '@/engine/cards/CardRegistry.js';

class TestImmediateCard extends ImmediateCard {
  public constructor(id = 'test-card') {
    const cardData: IBaseCard = {
      id,
      name: 'Test Immediate',
      price: 0,
      income: EResource.CREDIT,
      effects: [],
    };
    super(cardData);
  }
}

describe('CardRegistry', () => {
  it('register + create returns a card instance', () => {
    const registry = new CardRegistry();
    registry.register('test-card', () => new TestImmediateCard('test-card'));

    const card = registry.create('test-card');
    expect(card.id).toBe('test-card');
    expect(card.name).toBe('Test Immediate');
  });

  it('throws when creating an unregistered id', () => {
    const registry = new CardRegistry();
    expect(() => registry.create('missing-card')).toThrow(
      'Card "missing-card" has not been registered',
    );
  });

  it('createAll batch creates in order', () => {
    const registry = new CardRegistry();
    registry.register('a', () => new TestImmediateCard('a'));
    registry.register('b', () => new TestImmediateCard('b'));

    const cards = registry.createAll(['a', 'b']);
    expect(cards.map((card) => card.id)).toEqual(['a', 'b']);
  });

  it('default registry creates every card from shared card data', () => {
    const registry = getCardRegistry();

    for (const cardData of ALL_CARDS) {
      expect(registry.has(cardData.id), cardData.id).toBe(true);
      expect(() => registry.create(cardData.id), cardData.id).not.toThrow();
    }
  });
});
