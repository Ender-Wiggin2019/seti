import { UranusOrbiter } from '@/engine/cards/base/UranusOrbiterCard.js';

describe('UranusOrbiter', () => {
  it('loads expected card metadata', () => {
    const card = new UranusOrbiter();
    expect(card.id).toBe('58');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new UranusOrbiter();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('58');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
