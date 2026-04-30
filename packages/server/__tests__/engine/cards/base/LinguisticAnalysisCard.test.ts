import { LinguisticAnalysis } from '@/engine/cards/base/LinguisticAnalysisCard.js';

describe('LinguisticAnalysis', () => {
  it('loads expected card metadata', () => {
    const card = new LinguisticAnalysis();
    expect(card.id).toBe('102');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new LinguisticAnalysis();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('102');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
