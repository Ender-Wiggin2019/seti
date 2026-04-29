import { CardRegistry } from '@/engine/cards/CardRegistry.js';
import { registerBaseCards } from '@/engine/cards/register/registerBaseCards.js';

describe('registerBaseCards', () => {
  it('registers generic and bespoke base cards', () => {
    const registry = new CardRegistry();

    registerBaseCards(registry);

    expect(registry.has('16')).toBe(true);
    expect(registry.has('70')).toBe(true);
    expect(registry.has('137')).toBe(true);
    expect(registry.create('70').id).toBe('70');
  });

  it('registers migrated custom base cards without unhandled custom tokens', () => {
    const registry = new CardRegistry();

    registerBaseCards(registry);

    for (const cardId of [
      '9',
      '11',
      '12',
      '13',
      '15',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '38',
      '40',
      '42',
      '44',
      '45',
      '46',
      '47',
      '52',
      '53',
      '54',
      '55',
      '67',
      '71',
      '72',
      '73',
      '74',
      '75',
      '81',
      '84',
      '98',
      '99',
      '100',
      '114',
      '118',
      '120',
      '122',
      '123',
      '124',
      '125',
      '126',
      '133',
      '136',
      'SE EN 01',
    ]) {
      expect(registry.create(cardId).behavior.custom, cardId).toBeUndefined();
    }
  });
});
