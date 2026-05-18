import { CardRegistry } from '@/engine/cards/CardRegistry.js';
import { registerArkhosCards } from '@/engine/cards/register/registerArkhosCards.js';
import { registerSpaceAgencyAliens } from '@/engine/cards/register/registerSpaceAgencyAliens.js';

describe('registerSpaceAgencyAliens', () => {
  it('registers SA alien cards', () => {
    const registry = new CardRegistry();

    registerSpaceAgencyAliens(registry);

    expect(registry.has('SA.ET.1')).toBe(true);
    expect(registry.has('SA.ET.20')).toBe(true);
    expect(registry.create('SA.ET.14').id).toBe('SA.ET.14');
  });

  it('registers source-backed end-game scoring cards with dedicated implementations', () => {
    const registry = new CardRegistry();

    registerSpaceAgencyAliens(registry);

    expect(registry.create('SA.ET.1').constructor.name).toBe(
      'SaEt1GlyphidsCard',
    );
    expect(registry.create('SA.ET.9').constructor.name).toBe(
      'SaEt9GlyphidsCard',
    );
    expect(registry.create('SA.ET.11').constructor.name).toBe(
      'SaEt11BiosignatureScreeningCard',
    );
    expect(registry.create('SA.ET.12').constructor.name).toBe(
      'SaEt12PhysicalCharacterizationCard',
    );
    expect(registry.create('SA.ET.13').constructor.name).toBe(
      'SaEt13GenomeCharacterizationCard',
    );
    expect(registry.create('SA.ET.14').constructor.name).toBe(
      'SaEt14BreakthroughTheoryCard',
    );
  });
});

describe('registerArkhosCards', () => {
  it('registers all Arkhos security cards as creatable card instances', () => {
    const registry = new CardRegistry();

    registerArkhosCards(registry);

    for (let index = 1; index <= 12; index += 1) {
      const cardId = `AIcard${index.toString().padStart(2, '0')}`;
      expect(registry.has(cardId)).toBe(true);
      expect(registry.create(cardId).id).toBe(cardId);
    }
  });
});
