import { AdvancedNavigationSystem } from '@/engine/cards/base/AdvancedNavigationSystemCard.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('AdvancedNavigationSystem', () => {
  it('loads expected card id and metadata', () => {
    const card = new AdvancedNavigationSystem();

    expect(card.id).toBe('128');
    expect(card.name.length).toBeGreaterThan(0);
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });
});
