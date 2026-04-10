import { CornellUniversity } from '@/engine/cards/base/CornellUniversityCard.js';

describe('CornellUniversity', () => {
  it('loads expected card metadata', () => {
    const card = new CornellUniversity();
    expect(card.id).toBe('138');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new CornellUniversity();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('138');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
