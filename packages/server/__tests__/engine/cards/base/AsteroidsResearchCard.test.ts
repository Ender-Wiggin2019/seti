import { AsteroidsResearch } from '@/engine/cards/base/AsteroidsResearchCard.js';

describe('AsteroidsResearch', () => {
  it('loads expected card metadata', () => {
    const card = new AsteroidsResearch();
    expect(card.id).toBe('129');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new AsteroidsResearch();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('129');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
