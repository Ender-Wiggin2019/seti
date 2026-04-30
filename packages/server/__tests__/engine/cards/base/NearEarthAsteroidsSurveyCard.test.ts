import { NearEarthAsteroidsSurvey } from '@/engine/cards/base/NearEarthAsteroidsSurveyCard.js';

describe('NearEarthAsteroidsSurvey', () => {
  it('loads expected card metadata', () => {
    const card = new NearEarthAsteroidsSurvey();
    expect(card.id).toBe('95');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new NearEarthAsteroidsSurvey();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('95');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
