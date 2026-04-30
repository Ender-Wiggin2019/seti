import { CardRegistry } from '@/engine/cards/CardRegistry.js';
import { registerSpaceAgencyAliens } from '@/engine/cards/register/registerSpaceAgencyAliens.js';

describe('registerSpaceAgencyAliens', () => {
  it('registers SA alien cards', () => {
    const registry = new CardRegistry();

    registerSpaceAgencyAliens(registry);

    expect(registry.has('SA.ET.1')).toBe(true);
    expect(registry.has('SA.ET.20')).toBe(true);
    expect(registry.create('SA.ET.14').id).toBe('SA.ET.14');
  });
});
