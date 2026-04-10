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
});
