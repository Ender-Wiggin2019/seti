import { CardRegistry } from '@/engine/cards/CardRegistry.js';
import { registerAlienCards } from '@/engine/cards/register/registerAlienCards.js';

describe('registerAlienCards', () => {
  it('registers expected alien card id range', () => {
    const registry = new CardRegistry();

    registerAlienCards(registry);

    expect(registry.has('ET.1')).toBe(true);
    expect(registry.has('ET.55')).toBe(true);
    expect(registry.create('ET.1').id).toBe('ET.1');
  });
});
