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
});
