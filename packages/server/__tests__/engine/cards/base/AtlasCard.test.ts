import { Atlas } from '@/engine/cards/base/AtlasCard.js';

describe('Atlas', () => {
  it('loads expected card metadata', () => {
    const card = new Atlas();
    expect(card.id).toBe('70');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new Atlas();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('70');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
