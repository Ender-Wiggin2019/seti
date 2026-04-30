import { PlanetaryGeologicMap } from '@/engine/cards/base/PlanetaryGeologicMapCard.js';

describe('PlanetaryGeologicMap', () => {
  it('loads expected card metadata', () => {
    const card = new PlanetaryGeologicMap();
    expect(card.id).toBe('112');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new PlanetaryGeologicMap();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('112');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
