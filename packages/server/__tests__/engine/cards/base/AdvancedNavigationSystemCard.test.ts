import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('AdvancedNavigationSystem (card 128)', () => {
  it('loads expected card id and metadata via registry', () => {
    const card = getCardRegistry().create('128');

    expect(card.id).toBe('128');
    expect(card.name.length).toBeGreaterThan(0);
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });
});
