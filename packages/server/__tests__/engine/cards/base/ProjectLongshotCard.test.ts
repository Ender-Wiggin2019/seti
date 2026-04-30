import { ProjectLongshot } from '@/engine/cards/base/ProjectLongshotCard.js';

describe('ProjectLongshot', () => {
  it('loads expected card metadata', () => {
    const card = new ProjectLongshot();
    expect(card.id).toBe('87');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new ProjectLongshot();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('87');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
