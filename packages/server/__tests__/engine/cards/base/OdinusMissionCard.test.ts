import { OdinusMission } from '@/engine/cards/base/OdinusMissionCard.js';

describe('OdinusMission', () => {
  it('loads expected card metadata', () => {
    const card = new OdinusMission();
    expect(card.id).toBe('10');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new OdinusMission();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('10');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
