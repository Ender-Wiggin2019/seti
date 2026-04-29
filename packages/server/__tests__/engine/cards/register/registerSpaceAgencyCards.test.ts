import { CardRegistry } from '@/engine/cards/CardRegistry.js';
import { registerSpaceAgencyCards } from '@/engine/cards/register/registerSpaceAgencyCards.js';

describe('registerSpaceAgencyCards', () => {
  it('registers space agency base cards', () => {
    const registry = new CardRegistry();

    registerSpaceAgencyCards(registry);

    expect(registry.has('SA.1')).toBe(true);
    expect(registry.has('SA.42')).toBe(true);
    expect(registry.create('SA.7').id).toBe('SA.7');
  });

  it('registers migrated custom space agency cards without unhandled custom tokens', () => {
    const registry = new CardRegistry();

    registerSpaceAgencyCards(registry);

    for (const cardId of [
      'SA.1',
      'SA.2',
      'SA.6',
      'SA.12',
      'SA.13',
      'SA.14',
      'SA.15',
      'SA.17',
      'SA.18',
      'SA.19',
      'SA.20',
      'SA.22',
      'SA.27',
      'SA.28',
      'SA.29',
      'SA.30',
      'SA.32',
      'SA.34',
      'SA.37',
      'SA.38',
    ]) {
      expect(registry.create(cardId).behavior.custom, cardId).toBeUndefined();
    }
  });
});
